import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface DashboardResponse {
  todayTasksCount: number
  todayCompletedTasksCount: number
  todayWaterAmountMl: number
}

export const useDashboard = (date: string) => {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard', date],
    queryFn: async () => {
      const response = await apiClient.get<DashboardResponse>(`/dashboard`, {
        params: { date }
      })
      return response.data
    },
    enabled: !!date,
  })
}
