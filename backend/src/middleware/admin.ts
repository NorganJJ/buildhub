import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../config/prisma'

// Проверяет, является ли пользователь администратором.
export async function isAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return !!u?.isAdmin
}

// Разрешает действие, если пользователь — владелец ресурса ИЛИ администратор.
export async function canModify(userId: string | undefined, ownerId: string): Promise<boolean> {
  if (userId && userId === ownerId) return true
  return isAdmin(userId)
}

// preHandler для эндпоинтов только-для-админов (требует предварительный authenticate).
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).userId as string | undefined
  if (!(await isAdmin(userId))) {
    return reply.status(403).send({ error: 'Admin only' })
  }
}
