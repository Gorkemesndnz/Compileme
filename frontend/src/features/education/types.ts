export type EducationType = 'PROGRAMMING' | 'LANGUAGE' | 'OTHER' | (string & {})

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
}

export interface EducationResource {
  id: number
  education_id: number
  name: string
  type: EducationResourceType
  url_or_path: string
  level?: LanguageLevel
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
