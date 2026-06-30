import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import { BaseEntity } from './types'

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'DONE'
export type TechnologyCategory = 'BACKEND' | 'FRONTEND' | 'MOBILE' | 'DATABASE' | 'DEVOPS' | 'OTHER'
export type SnippetCategory = 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'OTHER'
export type LinkType = 'DESIGN' | 'REFERENCE' | 'REPO' | 'OTHER'
export type LinkCategory = 'FRONTEND' | 'BACKEND' | 'OTHER'
export type DocumentType = 'DB_SCHEMA' | 'REFACTOR_PLAN' | 'FUTURE_FEATURES' | 'TECH_DOC' | 'GENERAL'
export type DocumentFormat = 'MARKDOWN' | 'CODE' | 'SQL'

export interface Project extends BaseEntity {
  userId: number
  name: string
  description?: string
  status: ProjectStatus
}

export interface ProjectRequest {
  name: string
  description?: string
  status?: ProjectStatus
}

export interface ProjectPhase {
  id: number
  projectId: number
  name: string
  description?: string
  status: ProjectStatus
  startDate?: string
  endDate?: string
  orderIndex: number
}

export interface ProjectPhaseRequest {
  name: string
  description?: string
  status?: ProjectStatus
  startDate?: string
  endDate?: string
  orderIndex?: number
}

export interface ProjectTechnology {
  id: number
  projectId: number
  category: TechnologyCategory
  title: string
  technology: string
  notes?: string
  orderIndex: number
}

export interface ProjectTechnologyRequest {
  category: TechnologyCategory
  title: string
  technology: string
  notes?: string
  orderIndex?: number
}

export interface ProjectSnippet {
  id: number
  projectId: number
  title: string
  language?: string
  code: string
  description?: string
  category: SnippetCategory
  createdAt: string
}

export interface ProjectSnippetRequest {
  title: string
  language?: string
  code: string
  description?: string
  category: SnippetCategory
}

export interface ProjectLink {
  id: number
  projectId: number
  title: string
  url: string
  type: LinkType
  category?: LinkCategory
  notes?: string
  orderIndex: number
  createdAt?: string
}

export interface ProjectLinkRequest {
  title: string
  url: string
  type: LinkType
  category?: LinkCategory
  notes?: string
  orderIndex?: number
}

export interface ProjectDocument {
  id: number
  projectId: number
  type: DocumentType
  title: string
  content?: string
  contentFormat: DocumentFormat
  orderIndex: number
  createdAt?: string
}

export interface ProjectDocumentRequest {
  type: DocumentType
  title: string
  content?: string
  contentFormat: DocumentFormat
  orderIndex?: number
}

export interface PhaseReorderItem {
  id: number
  orderIndex: number
}

const invalidateProject = (queryClient: ReturnType<typeof useQueryClient>, projectId?: number) => {
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    queryClient.invalidateQueries({ queryKey: ['project-phases', projectId] })
    queryClient.invalidateQueries({ queryKey: ['project-technologies', projectId] })
    queryClient.invalidateQueries({ queryKey: ['project-snippets', projectId] })
    queryClient.invalidateQueries({ queryKey: ['project-links', projectId] })
    queryClient.invalidateQueries({ queryKey: ['project-documents', projectId] })
  }
}

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get<Project[]>('/projects')
      return response.data
    }
  })
}

export const useProject = (id?: number) => {
  return useQuery<Project>({
    queryKey: ['project', id],
    enabled: !!id,
    queryFn: async () => {
      const response = await apiClient.get<Project>(`/projects/${id}`)
      return response.data
    }
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()
  return useMutation<Project, Error, ProjectRequest>({
    mutationFn: async (request) => {
      const response = await apiClient.post<Project>('/projects', request)
      return response.data
    },
    onSuccess: () => invalidateProject(queryClient)
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation<Project, Error, { id: number; request: ProjectRequest }>({
    mutationFn: async ({ id, request }) => {
      const response = await apiClient.patch<Project>(`/projects/${id}`, request)
      return response.data
    },
    onSuccess: (project) => invalidateProject(queryClient, project.id)
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiClient.delete(`/projects/${id}`)
    },
    onSuccess: () => invalidateProject(queryClient)
  })
}

export const useProjectPhases = (projectId?: number) => {
  return useQuery<ProjectPhase[]>({
    queryKey: ['project-phases', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await apiClient.get<ProjectPhase[]>(`/projects/${projectId}/phases`)
      return response.data
    }
  })
}

export const useAddProjectPhase = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectPhase, Error, { projectId: number; request: ProjectPhaseRequest }>({
    mutationFn: async ({ projectId, request }) => {
      const response = await apiClient.post<ProjectPhase>(`/projects/${projectId}/phases`, request)
      return response.data
    },
    onSuccess: (phase) => invalidateProject(queryClient, phase.projectId)
  })
}

export const useUpdateProjectPhase = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectPhase, Error, { phaseId: number; request: ProjectPhaseRequest }>({
    mutationFn: async ({ phaseId, request }) => {
      const response = await apiClient.patch<ProjectPhase>(`/projects/phases/${phaseId}`, request)
      return response.data
    },
    onSuccess: (phase) => invalidateProject(queryClient, phase.projectId)
  })
}

export const useDeleteProjectPhase = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (phaseId) => {
      await apiClient.delete(`/projects/phases/${phaseId}`)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}

export const useReorderProjectPhases = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, PhaseReorderItem[]>({
    mutationFn: async (items) => {
      await apiClient.patch('/projects/phases/reorder', items)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}

export const useProjectTechnologies = (projectId?: number) => {
  return useQuery<ProjectTechnology[]>({
    queryKey: ['project-technologies', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await apiClient.get<ProjectTechnology[]>(`/projects/${projectId}/technologies`)
      return response.data
    }
  })
}

export const useAddProjectTechnology = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectTechnology, Error, { projectId: number; request: ProjectTechnologyRequest }>({
    mutationFn: async ({ projectId, request }) => {
      const response = await apiClient.post<ProjectTechnology>(`/projects/${projectId}/technologies`, request)
      return response.data
    },
    onSuccess: (technology) => invalidateProject(queryClient, technology.projectId)
  })
}

export const useDeleteProjectTechnology = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (techId) => {
      await apiClient.delete(`/projects/technologies/${techId}`)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}

export const useProjectSnippets = (projectId?: number) => {
  return useQuery<ProjectSnippet[]>({
    queryKey: ['project-snippets', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await apiClient.get<ProjectSnippet[]>(`/projects/${projectId}/snippets`)
      return response.data
    }
  })
}

export const useAddProjectSnippet = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectSnippet, Error, { projectId: number; request: ProjectSnippetRequest }>({
    mutationFn: async ({ projectId, request }) => {
      const response = await apiClient.post<ProjectSnippet>(`/projects/${projectId}/snippets`, request)
      return response.data
    },
    onSuccess: (snippet) => invalidateProject(queryClient, snippet.projectId)
  })
}

export const useDeleteProjectSnippet = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (snippetId) => {
      await apiClient.delete(`/projects/snippets/${snippetId}`)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}

export const useProjectLinks = (projectId?: number) => {
  return useQuery<ProjectLink[]>({
    queryKey: ['project-links', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await apiClient.get<ProjectLink[]>(`/projects/${projectId}/links`)
      return response.data
    }
  })
}

export const useAddProjectLink = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectLink, Error, { projectId: number; request: ProjectLinkRequest }>({
    mutationFn: async ({ projectId, request }) => {
      const response = await apiClient.post<ProjectLink>(`/projects/${projectId}/links`, request)
      return response.data
    },
    onSuccess: (link) => invalidateProject(queryClient, link.projectId)
  })
}

export const useDeleteProjectLink = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (linkId) => {
      await apiClient.delete(`/projects/links/${linkId}`)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}

export const useProjectDocuments = (projectId?: number) => {
  return useQuery<ProjectDocument[]>({
    queryKey: ['project-documents', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const response = await apiClient.get<ProjectDocument[]>(`/projects/${projectId}/documents`)
      return response.data
    }
  })
}

export const useAddProjectDocument = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectDocument, Error, { projectId: number; request: ProjectDocumentRequest }>({
    mutationFn: async ({ projectId, request }) => {
      const response = await apiClient.post<ProjectDocument>(`/projects/${projectId}/documents`, request)
      return response.data
    },
    onSuccess: (document) => invalidateProject(queryClient, document.projectId)
  })
}

export const useUpdateProjectDocument = () => {
  const queryClient = useQueryClient()
  return useMutation<ProjectDocument, Error, { documentId: number; request: ProjectDocumentRequest }>({
    mutationFn: async ({ documentId, request }) => {
      const response = await apiClient.patch<ProjectDocument>(`/projects/documents/${documentId}`, request)
      return response.data
    },
    onSuccess: (document) => invalidateProject(queryClient, document.projectId)
  })
}

export const useDeleteProjectDocument = (projectId?: number) => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: async (documentId) => {
      await apiClient.delete(`/projects/documents/${documentId}`)
    },
    onSuccess: () => invalidateProject(queryClient, projectId)
  })
}
