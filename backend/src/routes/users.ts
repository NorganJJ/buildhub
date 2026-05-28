import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'
import { requireAdmin } from '../middleware/admin'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

// Удаляет пользователя вместе с его данными: файлы проектов и аватар с диска,
// затем каскадное удаление в БД (проекты, файлы, голоса, комментарии, oauth, токены).
async function purgeUserData(userId: string, log: { error: (e: unknown) => void }): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { projects: { select: { id: true } } },
  })
  if (!user) return false

  const uploadsRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')
  const safeRm = (p: string) => {
    try {
      const abs = path.resolve(p)
      if (abs.startsWith(uploadsRoot + path.sep)) fs.rmSync(abs, { recursive: true, force: true })
    } catch (e) { log.error(e) }
  }
  for (const p of user.projects) {
    safeRm(path.join(uploadsRoot, p.id))
    safeRm(path.join(uploadsRoot, 'projects', p.id))
  }
  if (user.avatarUrl?.startsWith('/uploads/')) {
    safeRm(path.join(uploadsRoot, user.avatarUrl.replace(/^\/uploads\//, '')))
  }

  await prisma.user.delete({ where: { id: userId } })
  return true
}

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

async function saveImage(
  fileData: any,
  subdir: string,
  urlPrefix: string
): Promise<string> {
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
      fs.unlinkSync(filePath)
      throw new Error('File too large (max 5 MB)')
    }
    writeStream.write(chunk)
  }
  await new Promise<void>((resolve, reject) => {
    writeStream.end((err: any) => (err ? reject(err) : resolve()))
  })

  return `${urlPrefix}/${subdir}/${filename}`
}

export async function userRoutes(app: FastifyInstance) {
  // ВАЖНО: статические роуты /me и /me/projects ВЫШЕ параметрического /:username

  // PATCH /api/users/me — обновление профиля
  app.patch('/me', { preHandler: authenticate }, async (req, reply) => {
    const body = updateProfileSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed', details: body.error.flatten() })
    const userId = (req as any).userId
    const user = await prisma.user.update({
      where: { id: userId },
      data: body.data,
      select: { id: true, username: true, email: true, displayName: true, avatarUrl: true, bio: true, website: true, githubUrl: true, isVerified: true, isAdmin: true, createdAt: true },
    })
    return reply.send(user)
  })

  // DELETE /api/users/me — удаление аккаунта и всех данных (GDPR)
  app.delete('/me', { preHandler: authenticate }, async (req, reply) => {
    const userId = (req as any).userId
    const ok = await purgeUserData(userId, req.log)
    if (!ok) return reply.status(404).send({ error: 'User not found' })
    return reply.send({ success: true })
  })

  // DELETE /api/users/:id — удаление любого пользователя администратором
  app.delete('/:id', { preHandler: [authenticate, requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const adminId = (req as any).userId
    if (id === adminId) return reply.status(400).send({ error: 'Use account deletion in settings to remove your own account' })
    const ok = await purgeUserData(id, req.log)
    if (!ok) return reply.status(404).send({ error: 'User not found' })
    return reply.send({ success: true })
  })

  // POST /api/users/me/avatar — загрузка аватара
  app.post('/me/avatar', { preHandler: authenticate }, async (req, reply) => {
    const userId = (req as any).userId
    const fileData = await req.file()
    if (!fileData) return reply.status(400).send({ error: 'No file provided' })

    try {
      const avatarUrl = await saveImage(fileData, 'avatars', '/uploads')
      const user = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { id: true, username: true, email: true, displayName: true, avatarUrl: true, bio: true, website: true, githubUrl: true, isVerified: true, isAdmin: true, createdAt: true },
      })
      return reply.send(user)
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  // GET /api/users/me/projects — мои проекты
  app.get('/me/projects', { preHandler: authenticate }, async (req, reply) => {
    const userId = (req as any).userId
    const projects = await prisma.project.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { votes: true, files: true } } },
    })
    return reply.send(projects)
  })

  // GET /api/users/:username — профиль пользователя (ПОСЛЕ статических роутов)
  app.get('/:username', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, website: true, githubUrl: true, createdAt: true },
    })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    return reply.send(user)
  })
}
