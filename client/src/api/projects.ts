import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { Project, PaginatedResponse, CatalogueStats } from '../types'

export type SearchField = 'all' | 'title' | 'tags' | 'description'
export type SortKey = 'popular' | 'new' | 'downloads'

export const useCatalogueStats = () =>
  useQuery({
    queryKey: ['catalogue-stats'],
    queryFn: async () => {
      const { data } = await api.get<CatalogueStats>('/projects/stats')
      return data
    },
    staleTime: 1000 * 60,
  })

export interface ProjectsFilter {
  search?: string
  searchField?: SearchField
  sort?: SortKey
  type?: string
  tag?: string
  page?: number
  limit?: number
}

export const useProjects = (filters: ProjectsFilter = {}) =>
  useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Project>>('/projects', { params: filters })
      return data
    },
    staleTime: 0,
  })

export const useProject = (slug: string) =>
  useQuery({
    queryKey: ['project', slug],
    queryFn: async () => {
      const { data } = await api.get<Project>(`/projects/${slug}`)
      return data
    },
    enabled: !!slug,
    staleTime: 0,
  })

export const useMyProjects = () =>
  useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const { data } = await api.get<Project[]>('/users/me/projects')
      return data
    },
    staleTime: 0,
  })

export const useCreateProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<Project>) => {
      const { data } = await api.post<Project>('/projects', body)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      // Профиль автора тоже обновляем
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useUpdateProject = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<Project>) => {
      const { data } = await api.patch<Project>(`/projects/${id}`, body)
      return data
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', updated.slug] })
    },
  })
}

export const usePublishProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<Project>(`/projects/${id}/publish`)
      return data
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', updated.slug] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useDeleteProject = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

export const useUploadFile = (projectId: string, projectSlug: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      file,
      platform,
      version,
    }: {
      file: File
      platform: string
      version: string
    }) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(
        `/files/upload/${projectId}?platform=${platform}&version=${version}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectSlug] })
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useVote = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      value,
    }: {
      projectId: string
      value: 1 | -1 | 0
    }) => {
      const { data } = await api.post<{
        success: boolean
        likes: number
        dislikes: number
        userVote: 1 | -1 | null
      }>('/votes', { projectId, value })
      return { ...data, projectId }
    },
    onSuccess: (result) => {
      // БАГ 1 ИСПРАВЛЕН: оптимистично обновляем лайки/дизлайки сразу (без задержки рефетча)
      // + инвалидируем для получения актуального wilsonScore и порядка сортировки
      qc.setQueriesData<PaginatedResponse<Project>>(
        { queryKey: ['projects'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((p) =>
              p.id === result.projectId
                ? { ...p, likes: result.likes, dislikes: result.dislikes, userVote: result.userVote }
                : p
            ),
          }
        }
      )
      // Фоновый рефетч для обновления wilsonScore и порядка
      qc.invalidateQueries({ queryKey: ['projects'] })

      // Страница конкретного проекта
      qc.setQueriesData<Project>(
        { queryKey: ['project'] },
        (old) => {
          if (!old || old.id !== result.projectId) return old
          return { ...old, likes: result.likes, dislikes: result.dislikes, userVote: result.userVote }
        }
      )
    },
  })
}
