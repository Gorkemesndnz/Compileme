import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { Settings } from './types'

export const useSettings = () => {
  return useQuery<Settings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get<Settings>('/settings')
      return response.data
    }
  })
}

export const useUpdateSettings = () => {
  const queryClient = useQueryClient()
  return useMutation<Settings, Error, Partial<Settings>>({
    mutationFn: async (request) => {
      const response = await apiClient.put<Settings>('/settings', request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })
}
