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

// Optimistic Update Helper Function
const performOptimisticTaskUpdate = (
  queryClient: ReturnType<typeof useQueryClient>,
  id: number,
  updates: Partial<Task>
) => {
  const queryCache = queryClient.getQueryCache()
  const taskQueries = queryCache.getAll().filter(q => q.queryKey[0] === 'tasks')
  const previousQueries = new Map<any, any>()

  // 1. Snapshot original data
  taskQueries.forEach(query => {
    previousQueries.set(query.queryKey, queryClient.getQueryData(query.queryKey))
  })

  // 2. Find the task in the cache
  let foundTask: Task | null = null
  for (const query of taskQueries) {
    const data = queryClient.getQueryData<Task[]>(query.queryKey)
    if (data && Array.isArray(data)) {
      const t = data.find(item => item.id === id)
      if (t) {
        foundTask = t
        break
      }
    }
  }

  if (foundTask) {
    const updatedTask = { ...foundTask, ...updates } as Task
    taskQueries.forEach(query => {
      const data = queryClient.getQueryData<Task[]>(query.queryKey)
      if (data && Array.isArray(data)) {
        const filters = query.queryKey[1] as TaskFilters || {}
        
        let belongs = true
        if (filters.date) {
          belongs = updatedTask.scheduledDate === filters.date && updatedTask.planningBucket === 'DAY'
        } else if (filters.bucket) {
          belongs = updatedTask.planningBucket === filters.bucket
        } else if (filters.from && filters.to && updatedTask.scheduledDate) {
          belongs = updatedTask.scheduledDate >= filters.from && updatedTask.scheduledDate <= filters.to
        }

        const exists = data.some(item => item.id === id)
        if (belongs) {
          if (exists) {
            queryClient.setQueryData(query.queryKey, data.map(item => item.id === id ? updatedTask : item))
          } else {
            queryClient.setQueryData(query.queryKey, [...data, updatedTask])
          }
        } else {
          if (exists) {
            queryClient.setQueryData(query.queryKey, data.filter(item => item.id !== id))
          }
        }
      }
    })
  }

  return previousQueries
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
  return useMutation<Task, Error, number, { previousQueries: Map<any, any> }>({
    mutationFn: async (id) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}/complete`)
      return response.data
    },
    onMutate: (id) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] })

      // Find current status to toggle
      let currentStatus: TaskStatus = 'TODO'
      const queryCache = queryClient.getQueryCache()
      const taskQueries = queryCache.getAll().filter(q => q.queryKey[0] === 'tasks')
      
      for (const query of taskQueries) {
        const data = queryClient.getQueryData<Task[]>(query.queryKey)
        if (data && Array.isArray(data)) {
          const t = data.find(item => item.id === id)
          if (t) {
            currentStatus = t.status
            break
          }
        }
      }

      const nextStatus: TaskStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE'
      const completedAtValue = nextStatus === 'DONE' ? new Date().toISOString() : undefined

      const previousQueries = performOptimisticTaskUpdate(queryClient, id, {
        status: nextStatus,
        completedAt: completedAtValue
      })

      return { previousQueries }
    },
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, key) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => invalidateTaskViews(queryClient)
  })
}

export const useMoveTaskToTomorrow = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, MoveTaskRequest, { previousQueries: Map<any, any> }>({
    mutationFn: async ({ id, scheduledDate, planningBucket = 'DAY' }) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}/move`, {
        scheduledDate,
        planningBucket
      })
      return response.data
    },
    onMutate: ({ id, scheduledDate, planningBucket = 'DAY' }) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousQueries = performOptimisticTaskUpdate(queryClient, id, {
        scheduledDate,
        planningBucket
      })
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, key) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => invalidateTaskViews(queryClient)
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number, { previousQueries: Map<any, any> }>({
    mutationFn: async (id) => {
      await apiClient.delete(`/tasks/${id}`)
    },
    onMutate: (id) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      const queryCache = queryClient.getQueryCache()
      const taskQueries = queryCache.getAll().filter(q => q.queryKey[0] === 'tasks')
      const previousQueries = new Map<any, any>()

      taskQueries.forEach(query => {
        previousQueries.set(query.queryKey, queryClient.getQueryData(query.queryKey))
        const data = queryClient.getQueryData<Task[]>(query.queryKey)
        if (data && Array.isArray(data)) {
          queryClient.setQueryData(query.queryKey, data.filter(item => item.id !== id))
        }
      })

      return { previousQueries }
    },
    onError: (err, id, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, key) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => invalidateTaskViews(queryClient)
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()
  return useMutation<Task, Error, { id: number; request: Partial<TaskRequest> }, { previousQueries: Map<any, any> }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Task>(`/tasks/${id}`, request)
      return response.data
    },
    onMutate: ({ id, request }) => {
      queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousQueries = performOptimisticTaskUpdate(queryClient, id, request)
      return { previousQueries }
    },
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, key) => {
          queryClient.setQueryData(key, data)
        })
      }
    },
    onSettled: () => invalidateTaskViews(queryClient)
  })
}
