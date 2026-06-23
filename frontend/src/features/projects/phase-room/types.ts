// Shared types for PhaseDetailRoom sub-components

export type DetailTab = 'tasks' | 'schema' | 'docs'
export type SchemaView = 'diagram' | 'code' | 'tables'

// ── DB Schema Studio types ──────────────────────────────────────────

export interface DbColumn {
  id: string
  name: string
  type: string
  isPrimary: boolean
  isForeign: boolean
  referencesTable?: string
  referencesColumn?: string
}

export interface DbTable {
  id: string
  name: string
  columns: DbColumn[]
}

export interface DbSchemaDocument {
  version: 1
  tables: DbTable[]
}

// ── Notion Tree (Sub-phase) types ───────────────────────────────────

export interface SubPhaseNode {
  /** project_document id — null for unsaved new nodes */
  docId: number | null
  /** Display index (0.1, 0.2, …) */
  subIndex: number
  /** Sub-phase label, e.g. "API Endpointleri" */
  label: string
  /** Markdown / rich text content */
  content: string
  /** Whether content has unsaved changes */
  isDirty: boolean
}

// ── Auto-save indicator status ──────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
