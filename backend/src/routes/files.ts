import { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'
import { canModify } from '../middleware/admin'
import { signDownload, verifyDownload } from '../services/security'
import { isAllowedExtension, looksDisallowedByMagic } from '../services/uploadValidation'
import { scanFile } from '../services/fileScan'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// Суммарный лимит на размер всех файлов одного проекта (поста).
const POST_MAX_BYTES = 500 * 1024 * 1024 // 500 MB

// Сумма размеров уже загруженных файлов проекта (в байтах).
async function projectFilesTotal(projectId: string): Promise<number> {
  const agg = await prisma.projectFile.aggregate({
    where: { projectId },
    _sum: { fileSize: true },
  })
  return Number(agg._sum.fileSize ?? 0n)
}

export async function fileRoutes(app: FastifyInstance) {

  // POST /api/files/upload/:projectId — загрузка дистрибутива (только автор проекта)
  app.post('/upload/:projectId', { preHandler: authenticate }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (!(await canModify(userId, project.authorId))) return reply.status(403).send({ error: 'Forbidden' })

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file provided' })

    // Allowlist расширений
    if (!isAllowedExtension(data.filename)) {
      return reply.status(400).send({ error: 'File type not allowed' })
    }

    // Лимит суммарного размера файлов поста (500 МБ). Быстрый отказ, если уже на пределе.
    const existingTotal = await projectFilesTotal(projectId)
    if (existingTotal >= POST_MAX_BYTES) {
      return reply.status(413).send({ error: 'Post file size limit reached (500 MB total)' })
    }

    const uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads', projectId)
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadDir, filename)

    const hash = crypto.createHash('sha256')
    let fileSize = 0
    let head = Buffer.alloc(0)
    const writeStream = fs.createWriteStream(filePath)

    for await (const chunk of data.file) {
      if (head.length < 16) head = Buffer.concat([head, chunk]).subarray(0, 16)
      hash.update(chunk)
      fileSize += chunk.length
      writeStream.write(chunk)
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err: any) => (err ? reject(err) : resolve()))
    })

    // multipart прервал из-за лимита размера?
    if ((data.file as any).truncated) {
      fs.unlinkSync(filePath)
      return reply.status(413).send({ error: 'File too large' })
    }
    // Защита от подмены контента (HTML/SVG/XML под видом бинаря)
    if (looksDisallowedByMagic(head)) {
      fs.unlinkSync(filePath)
      return reply.status(400).send({ error: 'File content not allowed' })
    }

    // Точная проверка суммарного лимита поста с учётом только что загруженного файла.
    if (existingTotal + fileSize > POST_MAX_BYTES) {
      fs.unlinkSync(filePath)
      return reply.status(413).send({
        error: 'Post file size limit exceeded: all files in a post must total under 500 MB',
      })
    }

    // Антивирус-скан (каркас: 'clean', пока сканер не настроен)
    let scanStatus = 'clean'
    try {
      scanStatus = await scanFile(filePath)
    } catch (e) {
      req.log.error(e)
    }
    if (scanStatus === 'infected') {
      fs.unlinkSync(filePath)
      return reply.status(400).send({ error: 'File failed the malware scan' })
    }

    const sha256 = hash.digest('hex')
    const fileUrl = `/uploads/${projectId}/${filename}`
    const platform = (req.query as any).platform || 'UNIVERSAL'
    const version = (req.query as any).version || '1.0.0'

    const projectFile = await prisma.projectFile.create({
      data: { projectId, platform, version, filename: data.filename, fileUrl, fileSize: BigInt(fileSize), sha256, scanStatus },
    })

    return reply.status(201).send({
      id: projectFile.id,
      filename: projectFile.filename,
      fileUrl: projectFile.fileUrl,
      fileSize,
      sha256: projectFile.sha256,
      platform: projectFile.platform,
      version: projectFile.version,
      scanStatus: projectFile.scanStatus,
    })
  })

  // GET /api/files/:fileId/download-link — авторизованный выдаёт короткоживущую
  // подписанную ссылку (без JWT в URL).
  app.get('/:fileId/download-link', { preHandler: authenticate }, async (req, reply) => {
    const { fileId } = req.params as { fileId: string }
    const file = await prisma.projectFile.findUnique({ where: { id: fileId } })
    if (!file) return reply.status(404).send({ error: 'File not found' })
    if (file.scanStatus === 'infected') return reply.status(403).send({ error: 'File is blocked' })
    const { exp, sig } = signDownload(fileId)
    return reply.send({ url: `/api/files/download/${fileId}?exp=${exp}&sig=${sig}` })
  })

  // GET /api/files/download/:fileId — отдача файла по подписанной ссылке (стрим)
  app.get('/download/:fileId', async (req, reply) => {
    const { fileId } = req.params as { fileId: string }
    const { exp, sig } = req.query as { exp?: string; sig?: string }
    if (!verifyDownload(fileId, Number(exp), String(sig || ''))) {
      return reply.status(401).send({ error: 'Invalid or expired download link' })
    }

    const file = await prisma.projectFile.findUnique({ where: { id: fileId } })
    if (!file) return reply.status(404).send({ error: 'File not found' })
    if (file.scanStatus === 'infected') return reply.status(403).send({ error: 'File is blocked' })

    const uploadsRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')
    const rel = file.fileUrl.replace(/^\/uploads\//, '')
    const diskPath = path.resolve(uploadsRoot, rel)
    if (!diskPath.startsWith(uploadsRoot + path.sep) || !fs.existsSync(diskPath)) {
      return reply.status(404).send({ error: 'File not found' })
    }

    await prisma.project.update({ where: { id: file.projectId }, data: { downloadCount: { increment: 1 } } })

    const stat = fs.statSync(diskPath)
    const safe = file.filename.replace(/["\\\r\n]/g, '_')
    reply.header('Content-Type', 'application/octet-stream')
    reply.header('Content-Length', stat.size)
    reply.header('Content-Disposition', `attachment; filename="${safe}"`)
    reply.header('X-Content-Type-Options', 'nosniff')
    return reply.send(fs.createReadStream(diskPath))
  })
}
