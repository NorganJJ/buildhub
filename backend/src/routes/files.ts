import { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'
import { authenticate, authenticateDownload } from '../middleware/authenticate'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

export async function fileRoutes(app: FastifyInstance) {

  // POST /api/files/upload/:projectId
  app.post('/upload/:projectId', { preHandler: authenticate }, async (req, reply) => {
    const { projectId } = req.params as { projectId: string }
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const data = await req.file()
    if (!data) return reply.status(400).send({ error: 'No file provided' })

    const uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads', projectId)
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

    const safeName = data.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const filePath = path.join(uploadDir, filename)

    const hash = crypto.createHash('sha256')
    let fileSize = 0
    const writeStream = fs.createWriteStream(filePath)

    for await (const chunk of data.file) {
      hash.update(chunk)
      fileSize += chunk.length
      writeStream.write(chunk)
    }
    await new Promise<void>((resolve, reject) => {
      writeStream.end((err: any) => (err ? reject(err) : resolve()))
    })

    const sha256 = hash.digest('hex')
    const fileUrl = `/uploads/${projectId}/${filename}`
    const platform = (req.query as any).platform || 'UNIVERSAL'
    const version = (req.query as any).version || '1.0.0'

    const projectFile = await prisma.projectFile.create({
      data: {
        projectId,
        platform,
        version,
        filename: data.filename,
        fileUrl,
        fileSize: BigInt(fileSize),
        sha256,
      },
    })

    return reply.status(201).send({
      id: projectFile.id,
      filename: projectFile.filename,
      fileUrl: projectFile.fileUrl,
      fileSize,
      sha256: projectFile.sha256,
      platform: projectFile.platform,
      version: projectFile.version,
    })
  })

  // GET /api/files/download/:fileId — только для авторизованных; отдаём файл стримом
  app.get('/download/:fileId', { preHandler: authenticateDownload }, async (req, reply) => {
    const { fileId } = req.params as { fileId: string }
    const file = await prisma.projectFile.findUnique({ where: { id: fileId } })
    if (!file) return reply.status(404).send({ error: 'File not found' })

    // Путь на диске из fileUrl (/uploads/<projectId>/<stored>) с защитой от traversal
    const uploadsRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')
    const rel = file.fileUrl.replace(/^\/uploads\//, '')
    const diskPath = path.resolve(uploadsRoot, rel)
    if (!diskPath.startsWith(uploadsRoot + path.sep) || !fs.existsSync(diskPath)) {
      return reply.status(404).send({ error: 'File not found' })
    }

    await prisma.project.update({
      where: { id: file.projectId },
      data: { downloadCount: { increment: 1 } },
    })

    const stat = fs.statSync(diskPath)
    const safeName = file.filename.replace(/["\\\r\n]/g, '_')
    reply.header('Content-Type', 'application/octet-stream')
    reply.header('Content-Length', stat.size)
    reply.header('Content-Disposition', `attachment; filename="${safeName}"`)
    return reply.send(fs.createReadStream(diskPath))
  })
}
