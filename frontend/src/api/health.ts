import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface HealthResponse {
  status: string
  app: string
}

export const useHealth = () => {
  return useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await apiClient.get<HealthResponse>('/health')
      return response.data
    },
    refetchInterval: 5000, // Canlı bağlantı kontrolü için her 5 saniyede bir yeniler
  })
}
