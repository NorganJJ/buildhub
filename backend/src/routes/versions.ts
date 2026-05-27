import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'

const createSchema = z.object({
  projectId: z.string().uuid(),
  version: z.string().min(1).max(50).regex(/^[\w.\-+]+$/, 'Invalid version format'),
  notes: z.string().min(1).max(10000),
})

const updateSchema = z.object({
  version: z.string().min(1).max(50).regex(/^[\w.\-+]+$/, 'Invalid version format').optional(),
  notes: z.string().min(1).max(10000).optional(),
})

// Проверяет, что версия существует и текущий пользователь — автор проекта
async function loadOwnedVersion(versionId: string, userId: string) {
  const version = await prisma.projectVersion.findUnique({
    where: { id: versionId },
    include: { project: { select: { authorId: true } } },
  })
  if (!version) return { error: 'not_found' as const }
  if (version.project.authorId !== userId) return { error: 'forbidden' as const }
  return { version }
}

export async function versionRoutes(app: FastifyInstance) {

  // GET /api/versions?projectId= — список версий проекта (публично), новые сверху
  app.get('/', async (req, reply) => {
    const { projectId } = req.query as { projectId?: string }
    if (!projectId) return reply.status(400).send({ error: 'projectId required' })

    const versions = await prisma.projectVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ versions, total: versions.length })
  })

  // POST /api/versions — добавить версию (только автор проекта)
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const { projectId, version, notes } = parsed.data
    const userId = (req as any).userId

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const existing = await prisma.projectVersion.findUnique({
      where: { projectId_version: { projectId, version } },
    })
    if (existing) return reply.status(409).send({ error: 'Version already exists' })

    const created = await prisma.projectVersion.create({
      data: { projectId, version, notes },
    })
    return reply.status(201).send(created)
  })

  // PATCH /api/versions/:id — редактировать версию (только автор проекта)
  app.patch('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed' })

    const result = await loadOwnedVersion(id, userId)
    if (result.error === 'not_found') return reply.status(404).send({ error: 'Version not found' })
    if (result.error === 'forbidden') return reply.status(403).send({ error: 'Forbidden' })

    // Если меняется номер версии — проверяем уникальность в рамках проекта
    if (parsed.data.version && parsed.data.version !== result.version!.version) {
      const clash = await prisma.projectVersion.findUnique({
        where: { projectId_version: { projectId: result.version!.projectId, version: parsed.data.version } },
      })
      if (clash) return reply.status(409).send({ error: 'Version already exists' })
    }

    const updated = await prisma.projectVersion.update({
      where: { id },
      data: parsed.data,
    })
    return reply.send(updated)
  })

  // DELETE /api/versions/:id — удалить версию (только автор проекта)
  app.delete('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const result = await loadOwnedVersion(id, userId)
    if (result.error === 'not_found') return reply.status(404).send({ error: 'Version not found' })
    if (result.error === 'forbidden') return reply.status(403).send({ error: 'Forbidden' })

    await prisma.projectVersion.delete({ where: { id } })
    return reply.send({ success: true })
  })
}
