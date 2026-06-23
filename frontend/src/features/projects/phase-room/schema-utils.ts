import type { DbSchemaDocument, DbColumn, DbTable } from './types'

// ── Empty schema factory ────────────────────────────────────────────

export const emptySchema = (): DbSchemaDocument => ({
  version: 1,
  tables: [],
})

// ── Parse JSON content from project_document ────────────────────────

export function parseSchemaDocument(content?: string): DbSchemaDocument {
  if (!content) return emptySchema()
  try {
    const parsed = JSON.parse(content) as Partial<DbSchemaDocument>
    return {
      version: 1,
      tables: Array.isArray(parsed.tables) ? parsed.tables : [],
    }
  } catch {
    return emptySchema()
  }
}

// ── Generate Mermaid ER Diagram code ────────────────────────────────

export function generateMermaid(schema: DbSchemaDocument): string {
  if (schema.tables.length === 0) return '%% Tablo bulunmamaktadır'

  const tableBlocks = schema.tables.map((table) => {
    const cols = table.columns
      .map((col) => {
        const pk = col.isPrimary ? 'PK' : ''
        const fk = col.isForeign ? 'FK' : ''
        const key = [pk, fk].filter(Boolean).join(',')
        return `    ${col.type} ${col.name} ${key ? `"${key}"` : ''}`
      })
      .join('\n')
    return `  ${table.name} {\n${cols}\n  }`
  })

  const relations = schema.tables.flatMap((table) =>
    table.columns
      .filter((column) => column.isForeign && column.referencesTable)
      .map(
        (column) =>
          `  ${column.referencesTable} ||--|{ ${table.name} : "${column.name}"`
      )
  )

  return `erDiagram\n${tableBlocks.join('\n')}\n${relations.join('\n')}`
}

// ── Schema mutation helpers ─────────────────────────────────────────

const uid = () => Math.random().toString(36).substring(2, 9)

export function addTable(schema: DbSchemaDocument): DbSchemaDocument {
  return {
    ...schema,
    tables: [
      ...schema.tables,
      {
        id: uid(),
        name: 'yeni_tablo',
        columns: [
          {
            id: uid(),
            name: 'id',
            type: 'BIGINT',
            isPrimary: true,
            isForeign: false,
          },
        ],
      },
    ],
  }
}

export function removeTable(
  schema: DbSchemaDocument,
  tableId: string
): DbSchemaDocument {
  return {
    ...schema,
    tables: schema.tables.filter((t) => t.id !== tableId),
  }
}

export function renameTable(
  schema: DbSchemaDocument,
  tableId: string,
  name: string
): DbSchemaDocument {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId ? { ...t, name } : t
    ),
  }
}

export function addColumn(
  schema: DbSchemaDocument,
  tableId: string
): DbSchemaDocument {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            columns: [
              ...t.columns,
              {
                id: uid(),
                name: 'yeni_kolon',
                type: 'VARCHAR',
                isPrimary: false,
                isForeign: false,
              },
            ],
          }
        : t
    ),
  }
}

export function updateColumn(
  schema: DbSchemaDocument,
  tableId: string,
  columnId: string,
  patch: Partial<DbColumn>
): DbSchemaDocument {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            columns: t.columns.map((c) =>
              c.id === columnId ? { ...c, ...patch } : c
            ),
          }
        : t
    ),
  }
}

export function removeColumn(
  schema: DbSchemaDocument,
  tableId: string,
  columnId: string
): DbSchemaDocument {
  return {
    ...schema,
    tables: schema.tables.map((t) =>
      t.id === tableId
        ? { ...t, columns: t.columns.filter((c) => c.id !== columnId) }
        : t
    ),
  }
}
