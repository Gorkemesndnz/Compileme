import React from 'react'
import { EducationType } from '../types'

interface StudioModeProps {
  children: React.ReactNode
}

export const ProgrammingStudio: React.FC<StudioModeProps> = ({ children }) => <>{children}</>

export const LanguageStudio: React.FC<StudioModeProps> = ({ children }) => <>{children}</>

export const GeneralKnowledgeStudio: React.FC<StudioModeProps> = ({ children }) => <>{children}</>

export const StudioModePanel: React.FC<StudioModeProps & { type: EducationType }> = ({ type, children }) => {
  if (type === 'PROGRAMMING') {
    return <ProgrammingStudio>{children}</ProgrammingStudio>
  }
  if (type === 'LANGUAGE') {
    return <LanguageStudio>{children}</LanguageStudio>
  }
  return <GeneralKnowledgeStudio>{children}</GeneralKnowledgeStudio>
}

export const getPrimaryTabLabel = (type: EducationType) => {
  if (type === 'PROGRAMMING') return 'Code'
  if (type === 'LANGUAGE') return 'Kelimeler'
  return 'Kavramlar'
}

export const getPrimaryMetricLabel = (type: EducationType) => {
  if (type === 'PROGRAMMING') return 'Teknik Siniflar'
  if (type === 'LANGUAGE') return 'Kayitli Kelimeler'
  return 'Teknik Kavramlar'
}

export const getPrimaryMetricValue = (
  type: EducationType,
  totals: {
    codeFiles: number
    vocabWords: number
    cheatItems: number
  }
) => {
  if (type === 'PROGRAMMING') return totals.codeFiles
  if (type === 'LANGUAGE') return totals.vocabWords
  return totals.cheatItems
}
