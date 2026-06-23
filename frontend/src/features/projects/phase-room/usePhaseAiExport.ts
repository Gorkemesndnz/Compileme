import { useMemo } from 'react'
import { toast } from 'sonner'
import { Project, ProjectPhase, useProjectDocuments } from '../../../api/projects'
import { useTasks } from '../../../api/tasks'
import { parseSchemaDocument, generateMermaid } from './schema-utils'

const SUB_REGEX = /^\[PHASE:(\d+):SUB:(\d+)(?::STATUS:(\w+))?\]\s*(.*)$/
const METADATA_REGEX = /<!-- CM_METADATA: ({.*?}) -->\s*/g

function cleanMarkdownContent(content?: string) {
  return (content || '').replace(METADATA_REGEX, '').trim()
}

function slugifyFilename(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'phase'
  )
}

function downloadMarkdown(filename: string, markdown: string) {
  const blobUrl = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(blobUrl)
}

export function usePhaseAiExport(
  project: Project,
  phase: ProjectPhase,
  phaseIndex: number
) {
  const { data: projectTasks = [] } = useTasks({ projectId: project.id })
  const { data: documents = [] } = useProjectDocuments(project.id)

  const phaseTasks = useMemo(
    () => projectTasks.filter((task) => task.phaseId === phase.id),
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

  const subDocs = useMemo(() => {
    const prefix = `[PHASE:${phase.id}:SUB:`
    return documents
      .filter((doc) => doc.title?.startsWith(prefix))
      .map((doc) => {
        const match = doc.title.match(SUB_REGEX)
        if (!match) return null
        return {
          subIndex: parseInt(match[2], 10),
          status: match[3] || 'PLANNING',
          label: match[4] || `Alt Faz ${match[2]}`,
          content: cleanMarkdownContent(doc.content),
        }
      })
      .filter(Boolean)
      .sort((a, b) => a!.subIndex - b!.subIndex)
  }, [documents, phase.id])

  const techDocTitle = `TECH_STACK_ADR_PHASE_${phase.id}`
  const techDoc = useMemo(
    () => documents.find((doc) => doc.type === 'TECH_DOC' && doc.title === techDocTitle),
    [documents, techDocTitle]
  )

  const techList = useMemo(() => {
    if (!techDoc?.content) return []
    try {
      const parsed = JSON.parse(techDoc.content)
      return Array.isArray(parsed)
        ? parsed as Array<{ id: string; name: string; adrReason: string; category?: string; title?: string }>
        : []
    } catch {
      return []
    }
  }, [techDoc])

  const handleExport = () => {
    const remainingTasks = phaseTasks.filter((task) => task.status !== 'DONE')
    const completedTasks = phaseTasks.filter((task) => task.status === 'DONE')

    let markdown = `# Proje: ${project.name}\n`
    markdown += `## Faz ${phaseIndex + 1}: ${phase.name}\n\n`

    if (phase.description) {
      markdown += `**Açıklama:** ${phase.description}\n\n`
    }

    markdown += `### Görevler ve Durumları\n\n`
    markdown += `#### Kalan Görevler (${remainingTasks.length})\n`
    if (remainingTasks.length > 0) {
      remainingTasks.forEach((task, idx) => {
        markdown += `${idx + 1}. [ ] ${task.title}\n`
        if (task.notes) {
          markdown += `   - **Mühendislik Notları:** ${task.notes}\n`
        }
      })
    } else {
      markdown += `*Kalan görev bulunmamaktadır.*\n`
    }

    markdown += `\n#### Tamamlanan Görevler (${completedTasks.length})\n`
    if (completedTasks.length > 0) {
      completedTasks.forEach((task, idx) => {
        markdown += `${idx + 1}. [x] ${task.title}\n`
      })
    } else {
      markdown += `*Henüz tamamlanan görev bulunmamaktadır.*\n`
    }

    markdown += `\n### Teknoloji Yığını & Mimari Gerekçeler (ADR)\n`
    if (techList.length > 0) {
      techList.forEach((tech) => {
        const categoryLabel = tech.category || 'OTHER'
        const roleLabel = tech.title || 'Mühendislik Bileşeni'
        markdown += `- **${tech.name}** (${categoryLabel} - ${roleLabel}): ${tech.adrReason || '_Gerekçe yazılmamış._'}\n`
      })
    } else {
      markdown += `*Bu faz için henüz teknoloji yığını eklenmemiştir.*\n`
    }

    markdown += `\n### Veritabanı Şeması (Mermaid ER)\n`
    if (schema.tables.length > 0) {
      markdown += '```mermaid\n' + mermaidCode + '\n```\n\n'
      markdown += `#### Tablo Detayları\n`
      schema.tables.forEach((table) => {
        markdown += `**${table.name}**\n`
        markdown += `| Kolon | Tip | Key |\n|-------|-----|-----|\n`
        table.columns.forEach((col) => {
          const keys = [
            col.isPrimary ? 'PK' : '',
            col.isForeign ? `FK -> ${col.referencesTable || '?'}.${col.referencesColumn || 'id'}` : '',
          ].filter(Boolean).join(', ')
          markdown += `| ${col.name} | ${col.type} | ${keys || '-'} |\n`
        })
        markdown += `\n`
      })
    } else {
      markdown += `*Bu faz için tanımlanmış veritabanı tablosu bulunmamaktadır.*\n\n`
    }

    if (subDocs.length > 0) {
      markdown += `### Teknik Hafıza (Alt Modüller)\n`
      subDocs.forEach((sub) => {
        markdown += `#### Faz ${phaseIndex + 1}.${sub!.subIndex} - ${sub!.label}\n`
        markdown += sub!.content ? `${sub!.content}\n\n` : `*İçerik henüz yazılmamış.*\n\n`
      })
    }

    const filename = `${slugifyFilename(`${project.name}-${phase.name}`)}-ai-context.md`
    const copyPromise = navigator.clipboard?.writeText(markdown)
    if (!copyPromise) {
      downloadMarkdown(filename, markdown)
      toast.warning('Pano desteği yok; Markdown dosyası indirildi.')
      return
    }

    copyPromise
      .then(() => {
        toast.success('Faz hafızası Markdown olarak panoya kopyalandı.')
      })
      .catch(() => {
        downloadMarkdown(filename, markdown)
        toast.warning('Pano izni alınamadı; Markdown dosyası indirildi.')
      })
  }

  return { handleExport }
}
