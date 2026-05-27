import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

export interface CommentAuthor {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
}

export interface Comment {
  id: string
  body: string
  projectId: string
  authorId: string
  parentId: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  author: CommentAuthor | null
  replies: Comment[]
}

export const useComments = (projectId: string) =>
  useQuery({
    queryKey: ['comments', projectId],
    queryFn: async () => {
      const { data } = await api.get<{ comments: Comment[]; total: number }>(
        '/comments',
        { params: { projectId } }
      )
      return data
    },
    enabled: !!projectId,
    staleTime: 0,
  })

export const useCreateComment = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { body: string; parentId?: string }) => {
      const { data } = await api.post<Comment>('/comments', { ...payload, projectId })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId] })
    },
  })
}

export const useUpdateComment = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await api.patch<Comment>(`/comments/${id}`, { body })
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId] })
    },
  })
}

export const useDeleteComment = (projectId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/comments/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', projectId] })
    },
  })
}
