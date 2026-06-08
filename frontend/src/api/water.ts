import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export type WaterSource = 'BOTTLE_1500' | 'HALF_500' | 'GLASS_300' | 'CUSTOM'

export interface WaterLogResponse {
  id: number
  amountMl: number
  source: WaterSource
  createdAt: string
}

export interface WaterSummaryResponse {
  amountMl: number
  goalMl: number
  percentage: number
  logs: WaterLogResponse[]
}

export interface WaterLogRequest {
  amountMl?: number
  source: WaterSource
  logDate?: string // YYYY-MM-DD
}

export const useWaterSummary = (date: string) => {
  return useQuery<WaterSummaryResponse>({
    queryKey: ['water', date],
    queryFn: async () => {
      const response = await apiClient.get<WaterSummaryResponse>('/water', {
        params: { date }
      })
      return response.data
    },
    enabled: !!date,
  })
}

export const useAddWaterLog = () => {
  const queryClient = useQueryClient()
  return useMutation<WaterLogResponse, Error, WaterLogRequest>({
    mutationFn: async (logRequest) => {
      const response = await apiClient.post<WaterLogResponse>('/water', logRequest)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['water', variables.logDate] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.logDate] })
    }
  })
}

export const useDeleteWaterLog = (date: string) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/water/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['water', date] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', date] })
    }
  })
}
