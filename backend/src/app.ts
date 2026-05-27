import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import staticFiles from '@fastify/static'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import path from 'path'
import fs from 'fs'
import { assertSecrets } from './services/security'

import { authRoutes } from './routes/auth'
import { userRoutes } from './routes/users'
import { projectRoutes } from './routes/projects'
import { voteRoutes } from './routes/votes'
import { fileRoutes } from './routes/files'
import { imageRoutes } from './routes/images'
import { commentRoutes } from './routes/comments'
import { versionRoutes } from './routes/versions'
import { errorHandler } from './middleware/errorHandler'

export async function buildApp(): Promise<FastifyInstance> {
  // Отказываемся стартовать в проде со слабыми секретами
  assertSecrets()

  const app = Fastify({
    logger: process.env.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty' } }
      : true,
    // Лимит тела для не-multipart запросов (JSON). Загрузки идут через multipart
    // со своим лимитом fileSize.
    bodyLimit: 1024 * 1024, // 1 MB
  })

  // Security headers (helmet). CSP для SPA задаётся на стороне хостинга/nginx —
  // здесь CSP отключаем, чтобы не ломать Swagger UI; остальные заголовки включены.
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    // Разрешаем кросс-доменную загрузку картинок/файлов (клиент на другом порту/домене)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: { maxAge: 15552000, includeSubDomains: true }, // действует только по HTTPS
    referrerPolicy: { policy: 'no-referrer' },
  })

  // CORS. Разрешаем web-клиент(ы) из CLIENT_URL (можно несколько через запятую)
  // и origin'ы установленного Tauri-приложения:
  //   tauri://localhost        — macOS / Linux
  //   https://tauri.localhost  — Windows
  const webOrigins = (process.env.CLIENT_URL || 'http://localhost:1420')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  const allowedOrigins = new Set([
    ...webOrigins,
    'tauri://localhost',
    'https://tauri.localhost',
  ])
  await app.register(cors, {
    // Запросы без Origin (curl, server-to-server) пропускаем; иначе сверяем со списком.
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.has(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'), false)
    },
    credentials: true,
  })

  // Cookies (refresh-токен в httpOnly cookie, oauth state)
  await app.register(cookie)

  // JWT
  await app.register(jwt, {
    secret: process.env.JWT_ACCESS_SECRET || 'dev_secret_change_in_production',
  })

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Multipart (file uploads)
  await app.register(multipart, {
    limits: {
      fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '500')) * 1024 * 1024,
    },
  })

  // Static files (uploaded assets) — раздаём /uploads/** напрямую (картинки публичны).
  // НО файлы-дистрибутивы лежат в /uploads/<projectId>/... — прямой статический доступ
  // к ним закрыт, скачивание только через /api/files/download/:fileId (с авторизацией).
  const UUID_DIR = /^\/uploads\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i
  app.addHook('onRequest', async (req, reply) => {
    const pathOnly = req.url.split('?')[0]
    if (UUID_DIR.test(pathOnly)) {
      return reply.status(404).send({ error: 'Not found' })
    }
  })
  const uploadsDir = path.resolve(process.env.STORAGE_LOCAL_PATH || './uploads')
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
  await app.register(staticFiles, {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  })

  // Swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'BuildHub API',
        description: 'API для платформы публикации приложений',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  })
  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  })

  // Error handler
  app.setErrorHandler(errorHandler)

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  }))

  // Root
  app.get('/', async () => ({
    name: 'BuildHub API',
    version: '1.0.0',
    docs: '/docs',
    health: '/health',
  }))

  // Routes
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(userRoutes, { prefix: '/api/users' })
  await app.register(projectRoutes, { prefix: '/api/projects' })
  await app.register(voteRoutes, { prefix: '/api/votes' })
  await app.register(fileRoutes, { prefix: '/api/files' })
  await app.register(imageRoutes, { prefix: '/api/images' })
  await app.register(commentRoutes, { prefix: '/api/comments' })
  await app.register(versionRoutes, { prefix: '/api/versions' })

  return app
}
