import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import { useAuthStore } from '../stores/authStore'

// Загрузка аватара пользователя
export const useUploadAvatar = () => {
  const qc = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post('/users/me/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (updatedUser) => {
      // Обновляем пользователя в Zustand store сразу
      if (user) setUser({ ...user, avatarUrl: updatedUser.avatarUrl })
      qc.invalidateQueries({ queryKey: ['user-profile'] })
    },
  })
}

// Загрузка иконки проекта
export const useUploadProjectIcon = (projectId: string, projectSlug: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(`/images/project/${projectId}/icon`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectSlug] })
      qc.invalidateQueries({ queryKey: ['my-projects'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// Загрузка баннера проекта
export const useUploadProjectBanner = (projectId: string, projectSlug: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(`/images/project/${projectId}/banner`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectSlug] })
      qc.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// Загрузка скриншота
export const useUploadScreenshot = (projectId: string, projectSlug: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(`/images/project/${projectId}/screenshots`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectSlug] })
      qc.invalidateQueries({ queryKey: ['my-projects'] })
    },
  })
}

// Удаление скриншота
export const useDeleteScreenshot = (projectId: string, projectSlug: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (url: string) => {
      const { data } = await api.delete(`/images/project/${projectId}/screenshots`, {
        data: { url },
      })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectSlug] })
      qc.invalidateQueries({ queryKey: ['my-projects'] })
    },
  })
}
