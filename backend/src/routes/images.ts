import { FastifyInstance } from 'fastify'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

async function saveImage(fileData: any, subdir: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(fileData.mimetype)) {
    throw new Error('Invalid image type. Allowed: JPEG, PNG, WebP, GIF')
  }

  const uploadDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads', subdir)
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

  const ext = fileData.filename.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`
  const filePath = path.join(uploadDir, filename)

  let size = 0
  const writeStream = fs.createWriteStream(filePath)
  for await (const chunk of fileData.file) {
    size += chunk.length
    if (size > MAX_IMAGE_SIZE) {
      writeStream.destroy()
      try { fs.unlinkSync(filePath) } catch {}
      throw new Error('File too large (max 10 MB)')
    }
    writeStream.write(chunk)
  }
  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: any) => (err ? reject(err) : resolve()))
  })

  return `/uploads/${subdir}/${filename}`
}

export async function imageRoutes(app: FastifyInstance) {

  // POST /api/images/project/:id/icon — загрузка иконки проекта
  app.post('/project/:id/icon', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const fileData = await req.file()
    if (!fileData) return reply.status(400).send({ error: 'No file provided' })

    try {
      const iconUrl = await saveImage(fileData, `projects/${id}/images`)
      const updated = await prisma.project.update({
        where: { id },
        data: { iconUrl },
      })
      return reply.send({ iconUrl: updated.iconUrl })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // POST /api/images/project/:id/banner — загрузка баннера проекта
  app.post('/project/:id/banner', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const fileData = await req.file()
    if (!fileData) return reply.status(400).send({ error: 'No file provided' })

    try {
      const bannerUrl = await saveImage(fileData, `projects/${id}/images`)
      const updated = await prisma.project.update({
        where: { id },
        data: { bannerUrl },
      })
      return reply.send({ bannerUrl: updated.bannerUrl })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // POST /api/images/project/:id/screenshots — добавление скриншота (до 8 штук)
  app.post('/project/:id/screenshots', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })
    if (project.screenshots.length >= 8) {
      return reply.status(400).send({ error: 'Maximum 8 screenshots allowed' })
    }

    const fileData = await req.file()
    if (!fileData) return reply.status(400).send({ error: 'No file provided' })

    try {
      const screenshotUrl = await saveImage(fileData, `projects/${id}/images`)
      const updated = await prisma.project.update({
        where: { id },
        data: { screenshots: { push: screenshotUrl } },
      })
      return reply.send({ screenshots: updated.screenshots })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // DELETE /api/images/project/:id/screenshots — удаление скриншота по URL
  app.delete('/project/:id/screenshots', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId
    const { url } = req.body as { url: string }

    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const updated = await prisma.project.update({
      where: { id },
      data: { screenshots: project.screenshots.filter((s) => s !== url) },
    })
    return reply.send({ screenshots: updated.screenshots })
  })
}
