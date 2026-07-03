import { ProjectDocument } from '@/api/projects'

export type EducationType = 'PROGRAMMING' | 'LANGUAGE' | 'FRONTEND' | 'MOBILE' | 'OTHER'

export type EducationStatus = 'ACTIVE' | 'PAUSED' | 'DONE'

export type EducationResourceType = 'PDF' | 'SLIDE' | 'FILE' | 'LINK'

export type LanguageLevel = 'A1_A2' | 'B1' | 'B2' | 'C1_C2'

export type VocabularyType = 'Noun' | 'Verb' | 'Adj'

export interface CodeFile {
  name: string
  content: string
}

export interface VocabularyCard {
  id: number
  word: string
  meaning: string
  type: VocabularyType
  box: 1 | 2 | 3
  nextReview: string
}

export interface CheatsheetItem {
  id: number
  keyConcept: string
  description: string
}

export interface Education {
  id: number
  title: string
  source: string
  description?: string
  type: EducationType
  progress_percent: number
  status: EducationStatus
  next_study_date: string | null
  custom_category?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface EducationResource {
  id: number
  education_id: number
  name: string
  type: EducationResourceType
  url_or_path: string
  level?: LanguageLevel
  order_index?: number
  completed?: boolean
}

export interface EducationPractice {
  id: number
  education_id: number
  resource_id: number | null
  title: string
  completed: boolean
  code: string
  notes: string
  order_index?: number
}

export interface EducationCategoryGroup {
  type: EducationType
  label: string
  educations: Education[]
}

export interface FolderData {
  id: string
  name: string
  resourceIds: number[]
}

export interface ReinforcementTask {
  id: string
  title: string
  completed: boolean
  codeFileName: string
}

export interface ResourceNote {
  id: string
  resourceId: number | 'general'
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export type ReinforcementTarget =
  | { id: string; type: 'resource'; label: string; resource: EducationResource }
  | { id: string; type: 'project-document'; label: string; projectName: string; document: ProjectDocument }
