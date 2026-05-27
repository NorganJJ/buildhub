import { FastifyError, FastifyRequest, FastifyReply } from 'fastify'

export function errorHandler(error: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  const statusCode = error.statusCode || 500
  if (statusCode >= 500) req.log.error(error)
  return reply.status(statusCode).send({
    error: error.message || 'Internal Server Error',
    statusCode,
  })
}
