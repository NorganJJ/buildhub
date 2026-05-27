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

// Аутентификация для скачивания: токен из заголовка Authorization ИЛИ из ?token=
// (обычная ссылка <a href> не может слать заголовок).
export async function authenticateDownload(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify()
    ;(req as any).userId = (req.user as any).userId
    return
  } catch {
    /* пробуем query-токен ниже */
  }
  const token = (req.query as any)?.token
  if (token) {
    try {
      const payload = (req.server as any).jwt.verify(token) as any
      ;(req as any).userId = payload.userId
      return
    } catch {
      /* невалидный токен */
    }
  }
  return reply.status(401).send({ error: 'Unauthorized' })
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
