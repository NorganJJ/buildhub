import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate'
import { generateSlug } from '../utils/slug'
import { recalcWilsonScore } from '../services/wilsonScore'

const createProjectSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  longDesc: z.string().max(10000).optional(),
  type: z.enum(['WEB','IOS','ANDROID','DESKTOP_MAC','DESKTOP_WIN','DESKTOP_LINUX','CROSS_PLATFORM','OTHER']),
  tags: z.array(z.string().max(30)).max(10).default([]),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  githubUrl: z.string().url().optional().or(z.literal('')),
  creatorName: z.string().max(100).optional().or(z.literal('')),
  creatorUrl: z.string().url().optional().or(z.literal('')),
})

async function getVoteCounts(projectId: string) {
  const [likes, dislikes] = await Promise.all([
    prisma.vote.count({ where: { projectId, value: 1 } }),
    prisma.vote.count({ where: { projectId, value: -1 } }),
  ])
  return { likes, dislikes }
}

export async function projectRoutes(app: FastifyInstance) {

  // ——— ВАЖНО: статические роуты ВЫШЕ параметрических ———

  // GET /api/projects/user/:username — ДОЛЖЕН быть до /:slug
  app.get('/user/:username', async (req, reply) => {
    const { username } = req.params as { username: string }
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) return reply.status(404).send({ error: 'User not found' })
    const projects = await prisma.project.findMany({
      where: { authorId: user.id, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        // БАГ 1 ИСПРАВЛЕН: включаем author и files count — ProjectCard требует их
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        _count: { select: { votes: true, files: true } },
      },
    })

    const projectsWithVotes = await Promise.all(
      projects.map(async (p) => {
        const { likes, dislikes } = await getVoteCounts(p.id)
        return { ...p, likes, dislikes, userVote: null }
      })
    )

    // Сводная статистика профиля
    const stats = {
      projects: projectsWithVotes.length,
      downloads: projectsWithVotes.reduce((sum, p) => sum + (p.downloadCount || 0), 0),
      upvotes: projectsWithVotes.reduce((sum, p) => sum + (p.likes || 0), 0),
    }

    return reply.send({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        website: user.website,
        githubUrl: user.githubUrl,
        createdAt: user.createdAt,
      },
      projects: projectsWithVotes,
      stats,
    })
  })

  // GET /api/projects/stats — счётчики каталога (публично)
  app.get('/stats', async (_req, reply) => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [total, addedThisWeek, grouped] = await Promise.all([
      prisma.project.count({ where: { status: 'PUBLISHED' } }),
      prisma.project.count({ where: { status: 'PUBLISHED', createdAt: { gte: weekAgo } } }),
      prisma.project.groupBy({
        by: ['type'],
        where: { status: 'PUBLISHED' },
        _count: { _all: true },
      }),
    ])
    const byType: Record<string, number> = {}
    for (const g of grouped) byType[g.type] = g._count._all
    return reply.send({ total, addedThisWeek, byType })
  })

  // GET /api/projects — каталог
  app.get('/', { preHandler: optionalAuthenticate }, async (req, reply) => {
    const query = req.query as any
    const page = parseInt(query.page || '1')
    const limit = Math.min(parseInt(query.limit || '20'), 50)
    const skip = (page - 1) * limit
    const search = (query.search as string | undefined)?.trim() || undefined
    const type = query.type as string | undefined
    const tag = query.tag as string | undefined
    // область поиска: all (по умолчанию) | title | tags | description
    const searchField = (['title', 'tags', 'description'].includes(query.searchField) ? query.searchField : 'all') as
      'all' | 'title' | 'tags' | 'description'
    // сортировка: popular (по умолчанию) | new | downloads
    const sort = (['new', 'downloads'].includes(query.sort) ? query.sort : 'popular') as 'popular' | 'new' | 'downloads'

    // «Новинки» = опубликованные не давнее 7 дней назад
    const NEW_WINDOW_DAYS = 7

    // WilsonScore применяется внутри каждой категории:
    //  - popular / new — основной ключ;
    //  - downloads — вторичный (тай-брейк) после количества загрузок.
    // ВАЖНО: добавляем детерминированный вторичный ключ createdAt, иначе записи
    // с одинаковым score (например все 0/0 и посты с одним дизлайком) возвращаются
    // Postgres в произвольном порядке и «прыгают» при каждом рефетче.
    const orderBy =
      sort === 'downloads'
        ? [{ downloadCount: 'desc' as const }, { wilsonScore: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ wilsonScore: 'desc' as const }, { createdAt: 'desc' as const }]

    // Частичный поиск по тегам: scalar-list в Prisma не умеет ILIKE по элементам,
    // поэтому собираем id подходящих проектов сырым запросом и фильтруем по ним.
    let tagMatchIds: string[] | null = null
    if (search && (searchField === 'all' || searchField === 'tags')) {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM projects
        WHERE status = 'PUBLISHED'
          AND EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t ILIKE ${'%' + search + '%'})
      `
      tagMatchIds = rows.map((r) => r.id)
    }

    const where: any = { status: 'PUBLISHED' }
    if (type) where.type = type
    if (tag) where.tags = { has: tag } // фильтр по точному тегу (клик по тегу)
    if (sort === 'new') {
      // только записи, опубликованные за последние 7 дней
      where.createdAt = { gte: new Date(Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000) }
    }
    if (search) {
      if (searchField === 'title') {
        where.title = { contains: search, mode: 'insensitive' }
      } else if (searchField === 'description') {
        where.description = { contains: search, mode: 'insensitive' }
      } else if (searchField === 'tags') {
        where.id = { in: tagMatchIds ?? [] }
      } else {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { id: { in: tagMatchIds ?? [] } },
        ]
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          _count: { select: { votes: true, files: true } },
        },
      }),
      prisma.project.count({ where }),
    ])

    const userId = (req as any).userId

    const projectsWithVotes = await Promise.all(
      projects.map(async (p) => {
        const { likes, dislikes } = await getVoteCounts(p.id)
        const userVote = userId
          ? (await prisma.vote.findUnique({
              where: { userId_projectId: { userId, projectId: p.id } },
            }))?.value ?? null
          : null
        return { ...p, likes, dislikes, userVote }
      })
    )

    return reply.send({
      data: projectsWithVotes,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  })

  // GET /api/projects/debug — список всех проектов с id и slug (только для разработки)
  app.get('/debug', async (_req, reply) => {
    const projects = await prisma.project.findMany({
      select: { id: true, slug: true, title: true, status: true, authorId: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send(projects)
  })

  // GET /api/projects/:slug — страница проекта
  app.get('/:slug', { preHandler: optionalAuthenticate }, async (req, reply) => {
    const { slug } = req.params as { slug: string }

    const project = await prisma.project.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, bio: true, createdAt: true },
        },
        files: true,
        _count: { select: { votes: true } },
      },
    })
    if (!project) return reply.status(404).send({ error: 'Project not found' })

    const { likes, dislikes } = await getVoteCounts(project.id)
    const userId = (req as any).userId
    const userVote = userId
      ? (await prisma.vote.findUnique({
          where: { userId_projectId: { userId, projectId: project.id } },
        }))?.value ?? null
      : null

    // Кол-во опубликованных проектов автора (для карточки разработчика)
    const authorProjectCount = await prisma.project.count({
      where: { authorId: project.authorId, status: 'PUBLISHED' },
    })

    // BigInt (fileSize) не сериализуется в JSON — конвертируем в number
    const files = project.files.map((f) => ({ ...f, fileSize: Number(f.fileSize) }))

    return reply.send({ ...project, files, likes, dislikes, userVote, authorProjectCount })
  })

  // POST /api/projects
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const body = createProjectSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed', details: body.error.flatten() })

    const userId = (req as any).userId
    const slug = await generateSlug(body.data.title)

    const project = await prisma.project.create({
      data: { ...body.data, slug, authorId: userId },
    })
    return reply.status(201).send(project)
  })

  // ВАЖНО: /:id/publish ВЫШЕ /:id — иначе Fastify матчит publish как часть id
  // PATCH /api/projects/:id/publish
  app.patch('/:id/publish', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })
    const updated = await prisma.project.update({ where: { id }, data: { status: 'PUBLISHED' } })
    return reply.send(updated)
  })

  // PATCH /api/projects/:id
  app.patch('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })

    const body = createProjectSchema.partial().safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed' })

    const updated = await prisma.project.update({ where: { id }, data: body.data })
    return reply.send(updated)
  })

  // DELETE /api/projects/:id
  app.delete('/:id', { preHandler: authenticate }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const userId = (req as any).userId
    const project = await prisma.project.findUnique({ where: { id } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })
    if (project.authorId !== userId) return reply.status(403).send({ error: 'Forbidden' })
    await prisma.project.delete({ where: { id } })
    return reply.send({ success: true })
  })
}
