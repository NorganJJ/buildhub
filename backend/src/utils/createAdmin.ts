import 'dotenv/config'
import { prisma } from '../config/prisma'
import bcrypt from 'bcryptjs'

// Создаёт (или повышает до администратора) учётную запись админа.
//
// Пароль НЕ генерируется здесь — он передаётся через переменную окружения
// ADMIN_PASSWORD, чтобы оператор заранее знал его и нигде не «терял». Так же
// задаются ADMIN_EMAIL и ADMIN_USERNAME (есть значения по умолчанию).
//
// Пример (на сервере):
//   ADMIN_EMAIL=admin@buildhuber.ru ADMIN_USERNAME=admin \
//   ADMIN_PASSWORD='ваш-сложный-пароль' npm run create-admin
//
// Скрипт идемпотентен: повторный запуск обновит пароль и выставит isAdmin=true.
async function createAdmin() {
  const email = (process.env.ADMIN_EMAIL || 'admin@buildhuber.ru').toLowerCase().trim()
  const username = (process.env.ADMIN_USERNAME || 'admin').trim()
  const password = process.env.ADMIN_PASSWORD

  if (!password || password.length < 12) {
    console.error('❌ ADMIN_PASSWORD is required and must be at least 12 characters.')
    console.error('   Example: ADMIN_PASSWORD=\'...\' npm run create-admin')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      passwordHash,
      isAdmin: true,
      isVerified: true,
      // на случай повторного запуска чистим возможные токены сброса
      resetToken: null,
      resetTokenExp: null,
    },
    create: {
      email,
      username,
      passwordHash,
      displayName: 'Administrator',
      isAdmin: true,
      isVerified: true,
    },
  })

  console.log('✅ Admin account is ready.')
  console.log(`   id:       ${admin.id}`)
  console.log(`   email:    ${admin.email}`)
  console.log(`   username: ${admin.username}`)
  console.log('   password: (the ADMIN_PASSWORD you supplied)')
}

createAdmin()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
