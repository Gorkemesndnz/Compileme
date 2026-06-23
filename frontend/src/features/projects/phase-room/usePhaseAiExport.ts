import { useMemo } from 'react'
import { toast } from 'sonner'
import { Project, ProjectPhase, useProjectDocuments } from '../../../api/projects'
import { useTasks } from '../../../api/tasks'
import { parseSchemaDocument, generateMermaid } from './schema-utils'

const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)\]\s*(.*)$/

/**
 * Hook that produces an "Export AI Context" handler for a given phase.
 * Gathers: phase info, tasks (remaining vs completed), DB schema, sub-phase documents, and technology stack + ADR.
 */
export function usePhaseAiExport(
  project: Project,
  phase: ProjectPhase,
  phaseIndex: number
) {
  const { data: projectTasks = [] } = useTasks({ projectId: project.id })
  const { data: documents = [] } = useProjectDocuments(project.id)

  const phaseTasks = useMemo(
    () => projectTasks.filter((t) => t.phaseId === phase.id),
    [projectTasks, phase.id]
  )

  const dbSchemaDoc = useMemo(
    () =>
      documents.find(
        (doc) =>
          doc.type === 'DB_SCHEMA' &&
          doc.title === `DB_SCHEMA_PHASE_${phase.id}`
      ),
    [documents, phase.id]
  )

  const schema = useMemo(
    () => parseSchemaDocument(dbSchemaDoc?.content),
    [dbSchemaDoc?.content]
  )

  const mermaidCode = useMemo(() => generateMermaid(schema), [schema])

  // Sub-phase documents
  const subDocs = useMemo(() => {
    const prefix = `[PHASE:${phase.id}:SUB:`
    return documents
      .filter((d) => d.title && d.title.startsWith(prefix))
      .map((d) => {
        const match = d.title && d.title.match(SUB_REGEX)
        if (!match) return null
        return {
          subIndex: parseInt(match[2], 10),
          label: match[3],
          content: d.content || '',
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.subIndex - b!.subIndex)
  }, [documents, phase.id])

  // Phase technology stack & ADR doc
  const techDocTitle = `TECH_STACK_ADR_PHASE_${phase.id}`
  const techDoc = useMemo(
    () => documents.find((doc) => doc.type === 'TECH_DOC' && doc.title === techDocTitle),
    [documents, techDocTitle]
  )

  const techList = useMemo(() => {
    if (techDoc && techDoc.content) {
      try {
        const parsed = JSON.parse(techDoc.content)
        if (Array.isArray(parsed)) {
          return parsed as Array<{ id: string; name: string; adrReason: string; category?: string; title?: string }>
        }
      } catch {
        // ignore
      }
    }
    return []
  }, [techDoc])

  const handleExport = () => {
    let markdown = `# Proje: ${project.name}\n`
    markdown += `## Faz ${phaseIndex + 1}: ${phase.name}\n`
    if (phase.description) {
      markdown += `**Açıklama:** ${phase.description}\n\n`
    }

    // ── Tasks (Remaining vs Completed) ──────────────────────────────
    markdown += `### Görevler ve Durumları\n`
    const remainingTasks = phaseTasks.filter((t) => t.status !== 'DONE')
    const completedTasks = phaseTasks.filter((t) => t.status === 'DONE')

    markdown += `#### Kalan Görevler (${remainingTasks.length})\n`
    if (remainingTasks.length > 0) {
      remainingTasks.forEach((task, idx) => {
        markdown += `${idx + 1}. [ ] ${task.title}\n`
        if (task.notes) {
          markdown += `   - **Mühendislik Notları:** ${task.notes}\n`
        }
      })
    } else {
      markdown += `*Kalan görev bulunmamaktadır! 🎉*\n`
    }
    markdown += `\n`

    markdown += `#### Tamamlanan Görevler (${completedTasks.length})\n`
    if (completedTasks.length > 0) {
      completedTasks.forEach((task, idx) => {
        markdown += `${idx + 1}. [x] ${task.title}\n`
      })
    } else {
      markdown += `*Henüz tamamlanan görev bulunmamaktadır.*\n`
    }
    markdown += `\n`

    // ── Technology Stack & ADR ─────────────────────────────────────
    markdown += `### Teknoloji Yığını & Mimari Gerekçeler (ADR)\n`
    if (techList.length > 0) {
      techList.forEach((tech) => {
        const categoryLabel = tech.category || 'OTHER'
        const roleLabel = tech.title || 'Mühendislik Bileşeni'
        markdown += `- **${tech.name}** (${categoryLabel} - ${roleLabel}): ${tech.adrReason || '_Gerekçe yazılmamış._'}\n`
      })
    } else {
      markdown += `*Bu faz için henüz teknoloji yığını eklenmemiştir.*\n`
    }
    markdown += `\n`

    // ── DB Schema ───────────────────────────────────────────────────
    markdown += `### Veritabanı Şeması (Mermaid ER)\n`
    if (schema.tables.length > 0) {
      markdown += '```mermaid\n' + mermaidCode + '\n```\n\n'

      // Plain text table summary
      markdown += `#### Tablo Detayları\n`
      schema.tables.forEach((table) => {
        markdown += `**${table.name}**\n`
        markdown += `| Kolon | Tip | Key |\n|-------|-----|-----|\n`
        table.columns.forEach((col) => {
          const keys = [
            col.isPrimary ? 'PK' : '',
            col.isForeign
              ? `FK → ${col.referencesTable || '?'}.${col.referencesColumn || 'id'}`
              : '',
          ]
            .filter(Boolean)
            .join(', ')
          markdown += `| ${col.name} | ${col.type} | ${keys || '-'} |\n`
        })
        markdown += `\n`
      })
    } else {
      markdown += `*Bu faz için tanımlanmış veritabanı tablosu bulunmamaktadır.*\n\n`
    }

    // ── Sub-phase Documents ─────────────────────────────────────────
    if (subDocs.length > 0) {
      markdown += `### Teknik Hafıza (Alt Modüller)\n`
      subDocs.forEach((sub) => {
        markdown += `#### Faz ${phaseIndex + 1}.${sub!.subIndex} — ${sub!.label}\n`
        if (sub!.content.trim()) {
          markdown += sub!.content + '\n\n'
        } else {
          markdown += `*İçerik henüz yazılmamış.*\n\n`
        }
      })
    }

    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        toast.success('Faz hafızası Markdown olarak panoya kopyalandı! 🚀')
      })
      .catch(() => {
        toast.error('Kopyalama başarısız oldu.')
      })
  }

  return { handleExport }
}
