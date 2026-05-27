import { prisma } from '../config/prisma'

/**
 * Wilson Score Interval (lower bound) for ranking.
 * Accounts for both likes and dislikes with statistical confidence.
 * Used by Reddit, Hacker News, etc.
 * 
 * z = 1.96 for 95% confidence interval
 */
export async function recalcWilsonScore(projectId: string): Promise<number> {
  const likes = await prisma.vote.count({ where: { projectId, value: 1 } })
  const dislikes = await prisma.vote.count({ where: { projectId, value: -1 } })
  return wilsonScore(likes, dislikes)
}

export function wilsonScore(likes: number, dislikes: number): number {
  const n = likes + dislikes
  if (n === 0) return 0

  const z = 1.96 // 95% confidence
  const phat = likes / n
  const score =
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)

  return Math.round(score * 1000000) / 1000000 // 6 decimal places
}
