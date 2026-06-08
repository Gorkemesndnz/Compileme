import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export interface Project extends BaseEntity {
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'DONE'
}

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<Project[]>('/projects')
      return response.data
    }
  })
}
