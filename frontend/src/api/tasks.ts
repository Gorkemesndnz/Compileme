import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export type TaskStatus = 'TODO' | 'DONE'
export type TaskKind = 'GENERAL' | 'PROJECT' | 'EDUCATION' | 'REFACTOR'
export type PlanningBucket = 'UNSCHEDULED' | 'DAY' | 'WEEK' | 'MONTH'

export interface Task extends BaseEntity {
  userId: number
  title: string
  notes?: string
  status: TaskStatus
  kind: TaskKind
  scheduledDate?: string
  scheduledTime?: string
  durationMinutes?: number
  planningBucket: PlanningBucket
  targetPeriod?: string
  projectId?: number
  phaseId?: number
  educationId?: number
  orderIndex: number
  completedAt?: string
}

export interface TaskRequest {
  title: string
  notes?: string
  status: TaskStatus
  kind: TaskKind
  scheduledDate?: string
  scheduledTime?: string
  durationMinutes?: number
  planningBucket: PlanningBucket
  targetPeriod?: string
  projectId?: number
  phaseId?: number
  educationId?: number
}

export interface TaskFilters {
  date?: string
  from?: string
  to?: string
  bucket?: PlanningBucket
  kind?: TaskKind
  projectId?: number
  educationId?: number
}

export const useTasks = (filters: TaskFilters) => {
  return useQuery<Task[]>({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const response = await apiClient.get<Task[]>('/tasks', { params: filters })
      return response.data
    }
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, TaskRequest>({
    mutationFn: async (newTask) => {
      const response = await apiClient.post<Task>('/tasks', newTask)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}

export const useToggleTaskComplete = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, number>({
    mutationFn: async (id) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}/complete`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}

export const useMoveTaskToTomorrow = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, number>({
    mutationFn: async (id) => {
      // Yarına aktar endpoint'i patch /{id}/move?days=1 veya scheduledDate güncellemesi şeklinde çalışabilir.
      // Backend testlerinde taskService.moveTask(id, days) var.
      // HTTP endpoint: PATCH /api/tasks/{id}/move?days=1
      const response = await apiClient.patch<Task>(`/tasks/${id}/move`, null, {
        params: { days: 1 }
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/tasks/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, { id: number; request: Partial<TaskRequest> }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}
