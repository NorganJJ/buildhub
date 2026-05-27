import 'dotenv/config'
import { prisma } from '../config/prisma'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database...')

  const passwordHash = await bcrypt.hash('password123', 12)

  const user1 = await prisma.user.upsert({
    where: { email: 'demo@buildhub.app' },
    update: {},
    create: {
      email: 'demo@buildhub.app',
      username: 'demouser',
      passwordHash,
      displayName: 'Demo User',
      bio: 'I build cool apps for the BuildHub showcase.',
      isVerified: true,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@buildhub.app' },
    update: {},
    create: {
      email: 'jane@buildhub.app',
      username: 'janedev',
      passwordHash,
      displayName: 'Jane Dev',
      bio: 'Mobile and desktop developer.',
      isVerified: true,
    },
  })

  const projects = [
    {
      slug: 'habit-tracker-pro',
      title: 'Habit Tracker Pro',
      description: 'Track your daily habits with streaks, stats, and beautiful charts.',
      type: 'ANDROID' as const,
      tags: ['kotlin', 'android', 'productivity'],
      status: 'PUBLISHED' as const,
      authorId: user1.id,
      wilsonScore: 0.82,
    },
    {
      slug: 'finance-manager',
      title: 'Finance Manager',
      description: 'Personal finance tracking app for iOS with HealthKit-inspired design.',
      type: 'IOS' as const,
      tags: ['swift', 'ios', 'finance'],
      status: 'PUBLISHED' as const,
      authorId: user1.id,
      wilsonScore: 0.74,
    },
    {
      slug: 'devnotes',
      title: 'DevNotes',
      description: 'Minimal Markdown note-taking app for developers. macOS and Windows.',
      type: 'CROSS_PLATFORM' as const,
      tags: ['typescript', 'tauri', 'notes', 'markdown'],
      status: 'PUBLISHED' as const,
      authorId: user2.id,
      wilsonScore: 0.91,
    },
  ]

  for (const p of projects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    })
  }

  console.log('✅ Seed complete!')
  console.log('   Users: demo@buildhub.app / jane@buildhub.app (password: password123)')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
