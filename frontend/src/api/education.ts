import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export interface Education extends BaseEntity {
  title: string
  source: string
  progressPercent: number
  status: 'ACTIVE' | 'PAUSED' | 'DONE'
}

export const useEducations = () => {
  return useQuery<Education[]>({
    queryKey: ['educations'],
    queryFn: async () => {
      const response = await apiClient.get<Education[]>('/educations')
      return response.data
    }
  })
}
