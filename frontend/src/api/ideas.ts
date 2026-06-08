import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export type IdeaStatus = 'RAW' | 'DEVELOPING' | 'CONVERTED'

export interface IdeaResponse {
  id: number
  title: string
  content: string
  status: IdeaStatus
  tags: string
  convertedProjectId?: number
  createdAt: string
  updatedAt: string
}

export interface IdeaRequest {
  title: string
  content?: string
  status?: IdeaStatus
  tags?: string
}

export const useIdeas = () => {
  return useQuery<IdeaResponse[]>({
    queryKey: ['ideas'],
    queryFn: async () => {
      const response = await apiClient.get<IdeaResponse[]>('/ideas')
      return response.data
    }
  })
}

export const useCreateIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, IdeaRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<IdeaResponse>('/ideas', request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export const useUpdateIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, { id: number; request: IdeaRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<IdeaResponse>(`/ideas/${id}`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export const useConvertIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, number>({
    mutationFn: async (id) => {
      const response = await apiClient.post<IdeaResponse>(`/ideas/${id}/convert`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export const useDeleteIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/ideas/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}
