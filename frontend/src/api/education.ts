import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export type EducationType = 'PROGRAMMING' | 'LANGUAGE' | 'FRONTEND' | 'MOBILE' | 'OTHER'
export type EducationStatus = 'ACTIVE' | 'PAUSED' | 'DONE'
export type EducationResourceType = 'PDF' | 'SLIDE' | 'FILE' | 'LINK'

export interface Education extends BaseEntity {
  userId: number
  title: string
  source?: string
  sourceUrl?: string
  type: EducationType
  progressPercent: number
  status: EducationStatus
  nextStudyDate?: string | null
  durationHours?: number | null
  description?: string | null
  customCategory?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface EducationRequest {
  title: string
  source?: string
  sourceUrl?: string
  type: EducationType
  status?: EducationStatus
  nextStudyDate?: string | null
  durationHours?: number | null
  description?: string | null
  customCategory?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface ProgressUpdateRequest {
  progressPercent: number
}

export interface EducationResource {
  id: number
  educationId: number
  name: string
  type: EducationResourceType
  urlOrPath: string
  orderIndex: number
  completed: boolean
}

export interface EducationResourceRequest {
  name: string
  type: EducationResourceType
  urlOrPath: string
  orderIndex?: number
  completed?: boolean
}

export interface EducationResourceUpdateRequest {
  name?: string
  type?: EducationResourceType
  urlOrPath?: string
  orderIndex?: number
  completed?: boolean
}

export interface EducationResourceReorderItem {
  id: number
  orderIndex: number
}

export interface EducationPractice {
  id: number
  educationId: number
  resourceId: number | null
  title: string
  completed: boolean
  code?: string
  notes?: string
  orderIndex: number
}

export interface EducationPracticeRequest {
  title: string
  completed: boolean
  code?: string
  notes?: string
  resourceId?: number | null
  orderIndex?: number
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

export const useEducation = (id?: number) => {
  return useQuery<Education>({
    queryKey: ['educations', id],
    enabled: Number.isFinite(id),
    queryFn: async () => {
      const response = await apiClient.get<Education>(`/educations/${id}`)
      return response.data
    }
  })
}

export const useEducationResources = (educationId?: number) => {
  return useQuery<EducationResource[]>({
    queryKey: ['educations', educationId, 'resources'],
    enabled: Number.isFinite(educationId),
    queryFn: async () => {
      const response = await apiClient.get<EducationResource[]>(`/educations/${educationId}/resources`)
      return response.data
    }
  })
}

export const useEducationPractices = (educationId?: number) => {
  return useQuery<EducationPractice[]>({
    queryKey: ['educations', educationId, 'practices'],
    enabled: Number.isFinite(educationId),
    queryFn: async () => {
      const response = await apiClient.get<EducationPractice[]>(`/educations/${educationId}/practices`)
      return response.data
    }
  })
}

export interface EducationResourceTreeDto {
  id: number
  name: string
  type: EducationResourceType
  urlOrPath: string
  completed: boolean
  orderIndex: number
}

export interface EducationPracticeTreeDto {
  id: number
  resourceId: number | null
  title: string
  completed: boolean
  orderIndex: number
}

export interface EducationTreeResponse {
  resources: EducationResourceTreeDto[]
  practices: EducationPracticeTreeDto[]
}

export const useEducationTree = (educationId?: number) => {
  return useQuery<EducationTreeResponse>({
    queryKey: ['educations', educationId, 'tree'],
    enabled: Number.isFinite(educationId),
    queryFn: async () => {
      const response = await apiClient.get<EducationTreeResponse>(`/educations/${educationId}/tree`)
      return response.data
    }
  })
}

export const useLazyPractice = (practiceId?: number) => {
  return useQuery<EducationPractice>({
    queryKey: ['educations', 'practices', practiceId],
    enabled: Number.isFinite(practiceId),
    queryFn: async () => {
      const response = await apiClient.get<EducationPractice>(`/educations/practices/${practiceId}`)
      return response.data
    }
  })
}

export const useCreateEducationResource = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<EducationResource, Error, EducationResourceRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<EducationResource>(`/educations/${educationId}/resources`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'resources'] })
    }
  })
}

export const useDeleteEducationResource = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (resourceId) => {
      await apiClient.delete(`/educations/resources/${resourceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'resources'] })
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'practices'] })
    }
  })
}

export const useUpdateEducationResource = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<EducationResource, Error, { id: number; request: EducationResourceUpdateRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<EducationResource>(`/educations/resources/${id}`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'resources'] })
    }
  })
}

export const useReorderEducationResources = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, EducationResourceReorderItem[]>({
    mutationFn: async (items) => {
      await apiClient.patch(`/educations/${educationId}/resources/reorder`, items)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'resources'] })
    }
  })
}

export const useCreateEducationPractice = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<EducationPractice, Error, EducationPracticeRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<EducationPractice>(`/educations/${educationId}/practices`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'practices'] })
    }
  })
}

export const useUpdateEducationPractice = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<EducationPractice, Error, { id: number; request: EducationPracticeRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<EducationPractice>(`/educations/practices/${id}`, request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'practices'] })
    }
  })
}

export const useDeleteEducationPractice = (educationId: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (practiceId) => {
      await apiClient.delete(`/educations/practices/${practiceId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations', educationId, 'practices'] })
    }
  })
}

export const useUpdateEducationProgress = () => {
  const queryClient = useQueryClient()
  return useMutation<Education, Error, { id: number; request: ProgressUpdateRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Education>(`/educations/${id}/progress`, request)
      return response.data
    },
    onSuccess: (education) => {
      queryClient.invalidateQueries({ queryKey: ['educations'] })
      queryClient.invalidateQueries({ queryKey: ['educations', education.id] })
    }
  })
}

export const useCreateEducation = () => {
  const queryClient = useQueryClient()
  return useMutation<Education, Error, EducationRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<Education>('/educations', request)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations'] })
    }
  })
}

export const useUpdateEducation = () => {
  const queryClient = useQueryClient()
  return useMutation<Education, Error, { id: number; request: EducationRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Education>(`/educations/${id}`, request)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['educations'] })
      queryClient.invalidateQueries({ queryKey: ['educations', data.id] })
    }
  })
}

export const useDeleteEducation = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/educations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educations'] })
    }
  })
}
