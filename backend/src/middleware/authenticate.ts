import { FastifyRequest, FastifyReply } from 'fastify'

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    const payload = req.user as any
    ;(req as any).userId = payload.userId
  } catch {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
}

export async function optionalAuthenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    const payload = req.user as any
    ;(req as any).userId = payload.userId
  } catch {
    // Not authenticated — that's ok for optional auth
  }
}
