import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export interface MoveTaskRequest {
  id: number
  scheduledDate: string
  planningBucket?: PlanningBucket
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

const invalidateTaskViews = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  queryClient.invalidateQueries({ queryKey: ['calendar'] })
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
    onSuccess: () => invalidateTaskViews(queryClient)
  })
}

export const useToggleTaskComplete = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, number>({
    mutationFn: async (id) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}/complete`)
      return response.data
    },
    onSuccess: () => invalidateTaskViews(queryClient)
  })
}

export const useMoveTaskToTomorrow = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, MoveTaskRequest>({
    mutationFn: async ({ id, scheduledDate, planningBucket = 'DAY' }) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}/move`, {
        scheduledDate,
        planningBucket
      })
      return response.data
    },
    onSuccess: () => invalidateTaskViews(queryClient)
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/tasks/${id}`)
    },
    onSuccess: () => invalidateTaskViews(queryClient)
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, { id: number; request: Partial<TaskRequest> }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}`, request)
      return response.data
    },
    onSuccess: () => invalidateTaskViews(queryClient)
  })
}
