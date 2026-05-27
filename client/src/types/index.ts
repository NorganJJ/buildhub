export type ProjectType = 'WEB' | 'IOS' | 'ANDROID' | 'DESKTOP_MAC' | 'DESKTOP_WIN' | 'DESKTOP_LINUX' | 'CROSS_PLATFORM' | 'OTHER'
export type ProjectStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type Platform = 'MACOS' | 'WINDOWS' | 'LINUX' | 'IOS' | 'ANDROID' | 'WEB' | 'UNIVERSAL'

export interface Author {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  bio?: string
  createdAt?: string
}

export interface ProjectFile {
  id: string
  platform: Platform
  version: string
  filename: string
  fileUrl: string
  fileSize: number
  sha256: string
  createdAt: string
}

export interface ProjectVersion {
  id: string
  projectId: string
  version: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  slug: string
  title: string
  description: string
  longDesc?: string
  iconUrl?: string
  bannerUrl?: string
  screenshots: string[]
  type: ProjectType
  tags: string[]
  status: ProjectStatus
  websiteUrl?: string
  githubUrl?: string
  creatorName?: string
  creatorUrl?: string
  wilsonScore: number
  downloadCount: number
  createdAt: string
  updatedAt: string
  author: Author
  files?: ProjectFile[]
  likes?: number
  dislikes?: number
  userVote?: 1 | -1 | null
  authorProjectCount?: number
  _count?: { votes: number; files: number }
}

export interface CatalogueStats {
  total: number
  addedThisWeek: number
  byType: Partial<Record<ProjectType, number>>
}

export interface ProfileStats {
  projects: number
  downloads: number
  upvotes: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export const PROJECT_TYPE_ICONS: Record<ProjectType, string> = {
  WEB: '🌐', IOS: '🍎', ANDROID: '🤖', DESKTOP_MAC: '🖥', DESKTOP_WIN: '🪟',
  DESKTOP_LINUX: '🐧', CROSS_PLATFORM: '💻', OTHER: '📦',
}
