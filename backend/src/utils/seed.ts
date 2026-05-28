import 'dotenv/config'
import { prisma } from '../config/prisma'

// Демо-данные намеренно убраны: продакшн стартует с пустой базой.
// Администратор создаётся отдельным скриптом: `npm run create-admin`
// (см. src/utils/createAdmin.ts).
async function seed() {
  console.log('🌱 No seed data — BuildHub starts with an empty catalogue.')
  console.log('   Create the admin account with: npm run create-admin')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
