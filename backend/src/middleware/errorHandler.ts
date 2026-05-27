import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  const statusCode = error.statusCode || 500

  // 5xx — логируем детали, но НЕ раскрываем их клиенту (утечка стека/SQL/путей).
  if (statusCode >= 500) {
    req.log.error(error)
    return reply.status(statusCode).send({ error: 'Internal Server Error', statusCode })
  }

  // 4xx (валидация, rate-limit и т.п.) — сообщение можно отдать.
  return reply.status(statusCode).send({
    error: error.message || 'Request failed',
    statusCode,
  })
}
