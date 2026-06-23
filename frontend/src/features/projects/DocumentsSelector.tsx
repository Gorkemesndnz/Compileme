import React from 'react'
import { DocumentType } from '../../api/projects'
import { Select } from '../../components/ui/Select'

interface DocumentsSelectorProps {
  value: DocumentType
  onChange: (value: DocumentType) => void
}

const OPTIONS = [
  { label: 'DB Schema', value: 'DB_SCHEMA' as DocumentType, badgeClass: 'bg-blue-100/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20' },
  { label: 'Refactor Plan', value: 'REFACTOR_PLAN' as DocumentType, badgeClass: 'bg-purple-100/60 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200/20' },
  { label: 'Gelecek Özellik', value: 'FUTURE_FEATURES' as DocumentType, badgeClass: 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20' },
  { label: 'Tech Doc', value: 'TECH_DOC' as DocumentType, badgeClass: 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20' },
  { label: 'Genel Not', value: 'GENERAL' as DocumentType, badgeClass: 'bg-slate-100/70 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200/30' },
]

export const DocumentsSelector: React.FC<DocumentsSelectorProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={OPTIONS}
    />
  )
}
