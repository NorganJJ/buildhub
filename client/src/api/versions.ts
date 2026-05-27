import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { ProjectVersion } from '../types'

export const useVersions = (projectId: string) =>
  useQuery({
    queryKey: ['versions', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ versions: ProjectVersion[]; total: number }>(
        '/versions',
        { params: { projectId } }
      )
      return data
    },
    enabled: !!projectId,
    staleTime: 0,
  })

export const useCreateVersion = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { version: string; notes: string }) => {
      const { data } = await api.post<ProjectVersion>('/versions', { ...payload, projectId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', projectId] })
    },
  })
}

export const useUpdateVersion = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, version, notes }: { id: string; version?: string; notes?: string }) => {
      const { data } = await api.patch<ProjectVersion>(`/versions/${id}`, { version, notes })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', projectId] })
    },
  })
}

export const useDeleteVersion = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/versions/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['versions', projectId] })
    },
  })
}
