import 'dotenv/config'
import Fastify from 'fastify'
import { buildApp } from './app'

const start = async () => {
  const app = await buildApp()

  const port = parseInt(process.env.PORT || '3001')
  const host = process.env.HOST || '0.0.0.0'

  try {
    await app.listen({ port, host })
    console.log(`\n🚀 BuildHub API running at http://${host}:${port}`)
    console.log(`📖 Swagger docs: http://localhost:${port}/docs`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
