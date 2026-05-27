import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate'

const createSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
  projectId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
})

const updateSchema = z.object({
  body: z.string().min(1).max(2000).trim(),
})

// Поля автора для include
const authorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
}

// Рекурсивно строим дерево комментариев из плоского списка
function buildTree(comments: any[]): any[] {
  const map = new Map<string, any>()
  const roots: any[] = []

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] })
  }

  for (const c of map.values()) {
    if (c.parentId) {
      const parent = map.get(c.parentId)
      if (parent) {
        parent.replies.push(c)
      } else {
        roots.push(c) // осиротевший — показываем на верхнем уровне
      }
    } else {
      roots.push(c)
    }
  }

  return roots
}

// Скрываем тело удалённых комментариев, но сохраняем структуру веток
function sanitize(comment: any): any {
  return {
    ...comment,
    body: comment.isDeleted ? '[deleted]' : comment.body,
    author: comment.isDeleted ? null : comment.author,
    replies: comment.replies?.map(sanitize) ?? [],
  }
}

export async function commentRoutes(app: FastifyInstance) {

  // GET /api/comments?projectId= — получить все комментарии проекта деревом
  app.get('/', { preHandler: optionalAuthenticate }, async (req, reply) => {
    const { projectId } = req.query as { projectId?: string }
    if (!projectId) return reply.status(400).send({ error: 'projectId required' })

    const flat = await prisma.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: authorSelect } },
    })

    const tree = buildTree(flat).map(sanitize)
    const total = flat.filter((c) => !c.isDeleted).length

    return reply.send({ comments: tree, total })
  })

  // POST /api/comments — создать комментарий или ответ
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.flatten() })
    }
    const { body, projectId, parentId } = parsed.data
    const authorId = (req as any).userId

    // Проверяем что проект существует
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })

    // Если это ответ — проверяем что родительский комментарий существует и принадлежит тому же проекту
    if (parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: parentId } })
      if (!parent || parent.projectId !== projectId) {
        return reply.status(404).send({ error: 'Parent comment not found' })
      }
    }

    const comment = await prisma.comment.create({
      data: { body, projectId, authorId, parentId: parentId ?? null },
      include: { author: { select: authorSelect } },
    })

    return reply.status(201).send({ ...comment, replies: [] })
  })

  // PATCH /api/comments/:id — редактировать свой комментарий
  app.patch('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'Validation failed' })

    const comment = await prisma.comment.findUnique({ where: { id } })
    if (!comment) return reply.status(404).send({ error: 'Comment not found' })
    if (comment.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })
    if (comment.isDeleted) return reply.status(400).send({ error: 'Cannot edit deleted comment' })

    const updated = await prisma.comment.update({
      where: { id },
      data: { body: parsed.data.body },
      include: { author: { select: authorSelect } },
    })

    return reply.send(updated)
  })

  // DELETE /api/comments/:id — мягкое удаление (сохраняет ветку)
  app.delete('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { _count: { select: { replies: true } } },
    })
    if (!comment) return reply.status(404).send({ error: 'Comment not found' })
    if (comment.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    // Если есть ответы — мягкое удаление (тело скрывается, структура сохраняется)
    // Если ответов нет — физическое удаление
    if (comment._count.replies > 0) {
      await prisma.comment.update({ where: { id }, data: { isDeleted: true } })
    } else {
      await prisma.comment.delete({ where: { id } })
    }

    return reply.send({ success: true })
  })
}
