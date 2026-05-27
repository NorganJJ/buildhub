import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { authenticate } from '../middleware/authenticate'
import { recalcWilsonScore } from '../services/wilsonScore'

const voteSchema = z.object({
  projectId: z.string().uuid(),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
})

export async function voteRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: authenticate }, async (req, reply) => {
    const body = voteSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ error: 'Validation failed' })

    const userId = (req as any).userId
    const { projectId, value } = body.data

    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return reply.status(404).send({ error: 'Project not found' })

    if (value === 0) {
      await prisma.vote.deleteMany({ where: { userId, projectId } })
    } else {
      await prisma.vote.upsert({
        where: { userId_projectId: { userId, projectId } },
        create: { userId, projectId, value },
        update: { value },
      })
    }

    // Пересчитываем Wilson Score и сохраняем в проект
    const wilsonScore = await recalcWilsonScore(projectId)
    await prisma.project.update({ where: { id: projectId }, data: { wilsonScore } })

    // Возвращаем актуальные счётчики
    const [likes, dislikes] = await Promise.all([
      prisma.vote.count({ where: { projectId, value: 1 } }),
      prisma.vote.count({ where: { projectId, value: -1 } }),
    ])

    return reply.send({
      success: true,
      likes,
      dislikes,
      userVote: value === 0 ? null : value,
    })
  })
}
