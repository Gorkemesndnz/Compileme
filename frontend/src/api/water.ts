import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'
import { toast } from 'sonner'

export type WaterSource = 'BOTTLE_1500' | 'HALF_500' | 'GLASS_300' | 'CUSTOM'

export interface WaterLogResponse {
  id: number
  amountMl: number
  source: WaterSource
  createdAt: string
}

export interface WaterSummaryResponse {
  consumedMl: number
  targetMl: number
  percent: number
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
  return useMutation<WaterLogResponse, Error, WaterLogRequest, { previousSummary?: WaterSummaryResponse; date: string }>({
    mutationFn: async (logRequest) => {
      const response = await apiClient.post<WaterLogResponse>('/water', logRequest)
      return response.data
    },
    onMutate: async (newLog) => {
      const date = newLog.logDate || new Date().toISOString().split('T')[0]
      console.log('useAddWaterLog onMutate started. date:', date, 'newLog:', newLog)
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['water', date] })
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })

      // Snapshot the previous value
      const previousSummary = queryClient.getQueryData<WaterSummaryResponse>(['water', date])
      console.log('useAddWaterLog previousSummary from cache:', previousSummary)

      // Optimistically update
      if (previousSummary) {
        let addedAmount = newLog.amountMl
        if (!addedAmount) {
          if (newLog.source === 'GLASS_300') addedAmount = 300
          else if (newLog.source === 'HALF_500') addedAmount = 500
          else if (newLog.source === 'BOTTLE_1500') addedAmount = 1500
          else addedAmount = 250 // default fallback
        }

        const newAmount = previousSummary.consumedMl + addedAmount
        const newPercentage = Math.min(100, Math.round((newAmount / previousSummary.targetMl) * 100))

        const updatedSummary = {
          ...previousSummary,
          consumedMl: newAmount,
          percent: newPercentage,
          logs: [
            {
              id: Date.now(), // temporary client-side id
              amountMl: addedAmount,
              source: newLog.source,
              createdAt: new Date().toISOString()
            },
            ...previousSummary.logs
          ]
        }
        console.log('useAddWaterLog Setting optimistic data:', updatedSummary)
        queryClient.setQueryData<WaterSummaryResponse>(['water', date], updatedSummary)
      } else {
        console.warn('useAddWaterLog previousSummary was not found in cache! Skipping optimistic update.')
      }

      return { previousSummary, date }
    },
    onError: (err: any, newLog, context) => {
      console.error('useAddWaterLog onError triggered. err:', err)
      if (context?.previousSummary) {
        queryClient.setQueryData(['water', context.date], context.previousSummary)
      }
      const message = err.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu.'
      toast.error(`Su eklenemedi, işlem geri alındı: ${message}`)
    },
    onSettled: (data, error, variables, context) => {
      console.log('useAddWaterLog onSettled triggered. Invalidating queries...')
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}

export const useDeleteWaterLog = (date: string) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number, { previousSummary?: WaterSummaryResponse }>({
    mutationFn: async (id) => {
      await apiClient.delete(`/water/${id}`)
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['water', date] })
      await queryClient.cancelQueries({ queryKey: ['dashboard'] })

      // Snapshot previous value
      const previousSummary = queryClient.getQueryData<WaterSummaryResponse>(['water', date])

      // Optimistically update
      if (previousSummary) {
        const logToDelete = previousSummary.logs.find(log => log.id === id)
        if (logToDelete) {
          const newAmount = Math.max(0, previousSummary.consumedMl - logToDelete.amountMl)
          const newPercentage = Math.min(100, Math.round((newAmount / previousSummary.targetMl) * 100))
          
          queryClient.setQueryData<WaterSummaryResponse>(['water', date], {
            ...previousSummary,
            consumedMl: newAmount,
            percent: newPercentage,
            logs: previousSummary.logs.filter(log => log.id !== id)
          })
        }
      }

      return { previousSummary }
    },
    onError: (err: any, id, context) => {
      if (context?.previousSummary) {
        queryClient.setQueryData(['water', date], context.previousSummary)
      }
      const message = err.response?.data?.message || err.message || 'Bilinmeyen bir hata oluştu.'
      toast.error(`Su kaydı geri alınamadı, işlem iptal edildi: ${message}`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['water'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    }
  })
}
