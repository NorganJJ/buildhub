import { prisma } from '../config/prisma'

export async function generateSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)

  let slug = base
  let counter = 0
  while (await prisma.project.findUnique({ where: { slug } })) {
    counter++
    slug = `${base}-${counter}`
  }
  return slug
}
