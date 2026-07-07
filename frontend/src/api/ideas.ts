import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { PlanningBucket, Task } from './tasks'

export type IdeaStatus = 'RAW' | 'DEVELOPING' | 'CONVERTED'
export type IdeaResearchType = 'REFERENCE' | 'COMPETITOR' | 'MARKET' | 'INSPIRATION' | 'OTHER'

export interface IdeaResponse {
  id: number
  userId: number
  title: string
  content?: string
  status: IdeaStatus
  tags?: string
  convertedProjectId?: number
  entryCount: number
  researchCount: number
  taskCount: number
  createdAt: string
  updatedAt: string
}

export interface IdeaEntry {
  id: number
  ideaId: number
  content: string
  createdAt: string
  updatedAt: string
}

export interface IdeaResearch {
  id: number
  ideaId: number
  title: string
  url?: string
  type: IdeaResearchType
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface IdeaTaskLink {
  id: number
  ideaId: number
  entryId?: number
  task: Task
  createdAt: string
}

export interface IdeaDetailResponse {
  idea: IdeaResponse
  entries: IdeaEntry[]
  research: IdeaResearch[]
  tasks: IdeaTaskLink[]
}

export interface IdeaRequest {
  title?: string
  content?: string
  status?: IdeaStatus
  tags?: string
}

export interface IdeaEntryRequest {
  content: string
}

export interface IdeaResearchRequest {
  title: string
  url?: string
  type?: IdeaResearchType
  notes?: string
}

export interface IdeaTaskCreateRequest {
  entryId?: number
  title: string
  notes?: string
  scheduledDate?: string
  scheduledTime?: string
  durationMinutes?: number
  planningBucket?: PlanningBucket
  targetPeriod?: string
}

const invalidateIdeas = (queryClient: ReturnType<typeof useQueryClient>, ideaId?: number) => {
  queryClient.invalidateQueries({ queryKey: ['ideas'] })
  if (ideaId) queryClient.invalidateQueries({ queryKey: ['ideas', ideaId] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}

export const useIdeas = () => {
  return useQuery<IdeaResponse[]>({
    queryKey: ['ideas'],
    queryFn: async () => {
      const response = await apiClient.get<IdeaResponse[]>('/ideas')
      return response.data
    }
  })
}

export const useIdea = (id?: number) => {
  return useQuery<IdeaDetailResponse>({
    queryKey: ['ideas', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await apiClient.get<IdeaDetailResponse>(`/ideas/${id}`)
      return response.data
    }
  })
}

export const useCreateIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, IdeaRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<IdeaResponse>('/ideas', request)
      return response.data
    },
    onSuccess: () => invalidateIdeas(queryClient)
  })
}

export const useUpdateIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, { id: number; request: IdeaRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<IdeaResponse>(`/ideas/${id}`, request)
      return response.data
    },
    onSuccess: (_, variables) => invalidateIdeas(queryClient, variables.id)
  })
}

export const useAddIdeaEntry = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<IdeaEntry, Error, IdeaEntryRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<IdeaEntry>(`/ideas/${ideaId}/entries`, request)
      return response.data
    },
    onSuccess: () => invalidateIdeas(queryClient, ideaId)
  })
}

export const useDeleteIdeaEntry = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (entryId) => {
      await apiClient.delete(`/ideas/${ideaId}/entries/${entryId}`)
    },
    onSuccess: () => invalidateIdeas(queryClient, ideaId)
  })
}

export const useUpdateIdeaEntry = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<IdeaEntry, Error, { entryId: number; request: IdeaEntryRequest }>({
    mutationFn: async ({ entryId, request }) => {
      const response = await apiClient.patch<IdeaEntry>(`/ideas/${ideaId}/entries/${entryId}`, request)
      return response.data
    },
    onSuccess: () => invalidateIdeas(queryClient, ideaId)
  })
}

export const useAddIdeaResearch = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResearch, Error, IdeaResearchRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<IdeaResearch>(`/ideas/${ideaId}/research`, request)
      return response.data
    },
    onSuccess: () => invalidateIdeas(queryClient, ideaId)
  })
}

export const useDeleteIdeaResearch = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (researchId) => {
      await apiClient.delete(`/ideas/${ideaId}/research/${researchId}`)
    },
    onSuccess: () => invalidateIdeas(queryClient, ideaId)
  })
}

export const useCreateIdeaTask = (ideaId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<IdeaTaskLink, Error, IdeaTaskCreateRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<IdeaTaskLink>(`/ideas/${ideaId}/tasks`, request)
      return response.data
    },
    onSuccess: () => {
      invalidateIdeas(queryClient, ideaId)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
    }
  })
}

export const useConvertIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<IdeaResponse, Error, number>({
    mutationFn: async (id) => {
      const response = await apiClient.post<IdeaResponse>(`/ideas/${id}/convert`)
      return response.data
    },
    onSuccess: (_, id) => {
      invalidateIdeas(queryClient, id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export const useDeleteIdea = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/ideas/${id}`)
    },
    onSuccess: () => invalidateIdeas(queryClient)
  })
}
