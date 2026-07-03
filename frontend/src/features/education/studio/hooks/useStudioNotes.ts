import React from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import {
  EducationResource,
  EducationPractice,
  ResourceNote,
  ReinforcementTask,
  ReinforcementTarget,
} from '../../types'
import { serializeCodeFiles } from '../../components/studioHelpers'

interface UseStudioNotesProps {
  educationId: number
  isPersistedEducation: boolean
  education: any
  resources: EducationResource[]
  selectedResourceId: number | null | undefined
  setSelectedResourceId: React.Dispatch<React.SetStateAction<number | null | undefined>>
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<any>>
  setActiveFileName: React.Dispatch<React.SetStateAction<string>>
  setCodeDraft: React.Dispatch<React.SetStateAction<string | null>>
  confirmNavigation: () => boolean
  createPracticeMutation: any
}

export const useStudioNotes = ({
  educationId,
  isPersistedEducation,
  education,
  resources,
  selectedResourceId,
  setSelectedResourceId,
  activeTab,
  setActiveTab,
  setActiveFileName,
  setCodeDraft,
  confirmNavigation,
  createPracticeMutation,
}: UseStudioNotesProps) => {
  const [practices, setPractices] = React.useState<EducationPractice[]>([])
  const [selectedPracticeId, setSelectedPracticeId] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (!selectedPracticeId || !isPersistedEducation) return
    
    const existing = practices.find(p => p.id === selectedPracticeId)
    if (existing && (existing.code !== undefined || existing.notes !== undefined)) {
      return
    }

    setSaveState('saving')
    apiClient.get<any>(`/educations/practices/${selectedPracticeId}`)
      .then(res => {
        setPractices(prev => prev.map(p => p.id === selectedPracticeId ? {
          ...p,
          code: res.data.code || '',
          notes: res.data.notes || ''
        } : p))
        setSaveState('idle')
      })
      .catch(() => {
        setSaveState('idle')
      })
  }, [selectedPracticeId, isPersistedEducation, practices])

  const [notesDraft, setNotesDraft] = React.useState('')
  const [noteTitleDraft, setNoteTitleDraft] = React.useState('')
  const [activeResourceNoteId, setActiveResourceNoteId] = React.useState<string | null>(null)
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle')

  const [resourceNotes, setResourceNotes] = React.useState<Record<number | string, string>>({})
  const [resourceNoteItems, setResourceNoteItems] = React.useState<Record<string, ResourceNote[]>>({})
  const [activeNotesResourceId, setActiveNotesResourceId] = React.useState<number | null>(null)
  const [reinforcements, setReinforcements] = React.useState<Record<string, ReinforcementTask[]>>({})
  const [activeReinforceResourceId, setActiveReinforceResourceId] = React.useState<number | null>(null)
  const [newReinforcementTitle, setNewReinforcementTitle] = React.useState('')

  const savePractices = React.useCallback((newPractices: EducationPractice[]) => {
    setPractices(newPractices)
    if (!isPersistedEducation) {
      localStorage.setItem(`practices-${educationId}`, JSON.stringify(newPractices))
    }
  }, [isPersistedEducation, educationId])

  const saveResourceNotes = React.useCallback((newNotes: Record<number | string, string>) => {
    setResourceNotes(newNotes)
    localStorage.setItem(`resource-notes-${educationId}`, JSON.stringify(newNotes))
  }, [educationId])

  const saveResourceNoteItems = React.useCallback((newItems: Record<string, ResourceNote[]>) => {
    setResourceNoteItems(newItems)
    localStorage.setItem(`resource-note-items-${educationId}`, JSON.stringify(newItems))
  }, [educationId])

  const saveReinforcements = React.useCallback((newReinforcements: Record<string, ReinforcementTask[]>) => {
    setReinforcements(newReinforcements)
    localStorage.setItem(`reinforcements-${educationId}`, JSON.stringify(newReinforcements))
  }, [educationId])

  const selectedPractice = React.useMemo(
    () => practices.find((p) => p.id === selectedPracticeId),
    [practices, selectedPracticeId]
  )

  const getNoteForResource = React.useCallback((resId: number | string) => {
    return resourceNotes[resId] || ''
  }, [resourceNotes])

  const createPracticeFromDraft = React.useCallback(async (draft: Omit<EducationPractice, 'id'>) => {
    if (isPersistedEducation) {
      const response = await createPracticeMutation.mutateAsync({
        title: draft.title,
        completed: draft.completed,
        code: draft.code,
        notes: draft.notes,
        orderIndex: draft.order_index,
      })
      return {
        id: response.id,
        education_id: response.educationId,
        resource_id: response.resourceId,
        title: response.title,
        completed: response.completed,
        code: response.code || '',
        notes: response.notes || '',
        order_index: response.orderIndex,
        next_study_date: null,
      }
    } else {
      return {
        ...draft,
        id: Date.now(),
        next_study_date: null,
      }
    }
  }, [isPersistedEducation, createPracticeMutation])

  const handleUpdatePractice = React.useCallback(async (practiceId: number, fields: Partial<EducationPractice>) => {
    const updated = practices.map((p) => (p.id === practiceId ? { ...p, ...fields } : p))
    savePractices(updated)

    if (isPersistedEducation) {
      try {
        await apiClient.patch(`/education/practices/${practiceId}`, fields)
      } catch {
        // Suppress network error to maintain responsiveness
      }
    }
  }, [practices, isPersistedEducation, savePractices])

  const handleUpdateNoteForResource = React.useCallback((resId: number | string, content: string) => {
    const updated = { ...resourceNotes, [resId]: content }
    saveResourceNotes(updated)

    if (resId === 'general') {
      const generalPractice = practices.find(p => p.resource_id === null)
      if (generalPractice) {
        void handleUpdatePractice(generalPractice.id, { notes: content })
      }
    } else {
      const practice = practices.find(p => p.resource_id === Number(resId))
      if (practice) {
        void handleUpdatePractice(practice.id, { notes: content })
      }
    }
  }, [resourceNotes, practices, saveResourceNotes, handleUpdatePractice])

  const handleCreateNoteForResource = React.useCallback((resourceKey: string, title?: string) => {
    const now = new Date().toISOString()
    const nextNote: ResourceNote = {
      id: `note-${resourceKey}-${Date.now()}`,
      resourceId: resourceKey === 'general' ? 'general' : Number(resourceKey),
      title: title?.trim() || 'Yeni Not',
      content: '',
      createdAt: now,
      updatedAt: now
    }
    const updated = {
      ...resourceNoteItems,
      [resourceKey]: [...(resourceNoteItems[resourceKey] || []), nextNote]
    }
    saveResourceNoteItems(updated)
    setActiveResourceNoteId(nextNote.id)
    setNoteTitleDraft(nextNote.title)
    setNotesDraft('')
    setActiveTab('notes')
    toast.success('Yeni not başlığı oluşturuldu.')
  }, [resourceNoteItems, saveResourceNoteItems, setNoteTitleDraft, setNotesDraft, setActiveTab])

  const handleDeleteNoteForResource = React.useCallback((resourceKey: string, noteId: string) => {
    const nextNotes = (resourceNoteItems[resourceKey] || []).filter((note) => note.id !== noteId)
    const updated = {
      ...resourceNoteItems,
      [resourceKey]: nextNotes
    }
    saveResourceNoteItems(updated)
    const fallback = nextNotes[0]
    setActiveResourceNoteId(fallback?.id || null)
    setNoteTitleDraft(fallback?.title || '')
    setNotesDraft(fallback?.content || '')
    saveResourceNotes({
      ...resourceNotes,
      [resourceKey]: nextNotes.map((note) => `# ${note.title}\n${note.content}`).join('\n\n')
    })
    toast.success('Not silindi.')
  }, [resourceNoteItems, resourceNotes, saveResourceNoteItems, saveResourceNotes, setNoteTitleDraft, setNotesDraft])

  const handleOpenNotesForResource = React.useCallback((res: EducationResource) => {
    if (!confirmNavigation()) return
    const resourceKey = String(res.id)
    setSelectedResourceId(res.id)
    const notesForResource = resourceNoteItems[resourceKey] || []
    if (notesForResource.length > 0) {
      const firstNote = notesForResource[0]
      setActiveResourceNoteId(firstNote.id)
      setNoteTitleDraft(firstNote.title)
      setNotesDraft(firstNote.content)
    } else {
      handleCreateNoteForResource(resourceKey, `${res.name} Notu`)
    }
    setActiveTab('notes')
  }, [confirmNavigation, resourceNoteItems, setSelectedResourceId, handleCreateNoteForResource, setNoteTitleDraft, setNotesDraft, setActiveTab])

  const handleOpenCodeForResource = React.useCallback(async (res: EducationResource) => {
    if (!confirmNavigation()) return
    let practice = practices.find(p => p.resource_id === res.id)
    if (!practice) {
      const newPractice = await createPracticeFromDraft({
        education_id: educationId,
        resource_id: res.id,
        title: `${res.name} Pratik & Kod`,
        completed: false,
        code: serializeCodeFiles([{
          name: 'Main.java',
          content: `// Pratik Kaynağı: ${res.name}\n// Bu kaynak için pratik kodlarınızı buraya yazın.\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe pratik basariyla olusturuldu.");\n    }\n}`
        }]),
        notes: getNoteForResource(res.id),
        order_index: practices.length + 1
      })
      const updatedPractices = [...practices, newPractice]
      savePractices(updatedPractices)
      practice = newPractice
    }

    setSelectedPracticeId(practice.id)
    setSelectedResourceId(res.id)
    setActiveFileName('Main.java')
    setActiveTab('primary')
    toast.success(`Kod editörü açıldı: ${res.name}`)
  }, [confirmNavigation, practices, educationId, getNoteForResource, createPracticeFromDraft, savePractices, setSelectedPracticeId, setSelectedResourceId, setActiveFileName, setActiveTab])

  const handleSaveNotes = React.useCallback(async () => {
    const activeNoteResourceKey = selectedResourceId ? String(selectedResourceId) : 'general'
    if (!activeResourceNoteId) return
    setSaveState('saving')
    const now = new Date().toISOString()
    const currentNotes = resourceNoteItems[activeNoteResourceKey] || []
    const updatedNotesForResource = currentNotes.map((note) =>
      note.id === activeResourceNoteId
        ? {
            ...note,
            title: noteTitleDraft.trim() || 'Başlıksız Not',
            content: notesDraft,
            updatedAt: now
          }
        : note
    )
    const updatedNoteItems = {
      ...resourceNoteItems,
      [activeNoteResourceKey]: updatedNotesForResource
    }
    saveResourceNoteItems(updatedNoteItems)

    const mergedContent = updatedNotesForResource
      .map((note) => `# ${note.title}\n\n${note.content}`)
      .join('\n\n---\n\n')
    const updatedLegacyNotes = { ...resourceNotes, [activeNoteResourceKey]: mergedContent }
    saveResourceNotes(updatedLegacyNotes)

    if (activeNoteResourceKey === 'general') {
      const generalPractice = practices.find(p => p.resource_id === null)
      if (generalPractice) {
        void handleUpdatePractice(generalPractice.id, { notes: mergedContent })
      }
    } else {
      const practice = practices.find(p => p.resource_id === Number(activeNoteResourceKey))
      if (practice) {
        void handleUpdatePractice(practice.id, { notes: mergedContent })
      }
    }

    setTimeout(() => {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 1000)
    }, 500)
    toast.success('Notlar başarıyla kaydedildi.')
  }, [selectedResourceId, activeResourceNoteId, noteTitleDraft, notesDraft, resourceNoteItems, resourceNotes, practices, saveResourceNoteItems, saveResourceNotes, handleUpdatePractice])

  const handleAddReinforceTask = React.useCallback((targetId: string | number, title: string) => {
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const taskList = reinforcements[targetKey] || []
    if (taskList.length >= 10) {
      toast.error('En fazla 10 pekiştirme görevi ekleyebilirsiniz.')
      return
    }
    const newTask: ReinforcementTask = {
      id: `reinforce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      completed: false,
      codeFileName: `Pekistirme_${targetKey.replace(/[^a-zA-Z0-9]/g, '_')}_${taskList.length + 1}.java`
    }
    const updated = {
      ...reinforcements,
      [targetKey]: [...taskList, newTask]
    }
    saveReinforcements(updated)
    toast.success('Pekiştirme projesi eklendi.')
  }, [reinforcements, saveReinforcements])

  const handleToggleReinforceTask = React.useCallback((targetId: string | number, taskId: string) => {
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const list = reinforcements[targetKey] || []
    const updated = list.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
    saveReinforcements({ ...reinforcements, [targetKey]: updated })
    toast.success('Pekiştirme görevi durumu güncellendi.')
  }, [reinforcements, saveReinforcements])

  const handleDeleteReinforceTask = React.useCallback((targetId: string | number, taskId: string) => {
    if (!window.confirm('Bu pekiştirme görevini silmek istediğinize emin misiniz?')) return
    const targetKey = typeof targetId === 'number' ? `resource:${targetId}` : targetId
    const list = reinforcements[targetKey] || []
    const updated = list.filter((task) => task.id !== taskId)
    saveReinforcements({ ...reinforcements, [targetKey]: updated })
    toast.success('Pekiştirme görevi silindi.')
  }, [reinforcements, saveReinforcements])

  const handleWriteCodeForTarget = React.useCallback(async (target: ReinforcementTarget, task?: ReinforcementTask) => {
    if (!confirmNavigation()) return
    if (target.type !== 'resource') return
    const res = target.resource
    if (!res) return

    let practice = practices.find(p => p.resource_id === res.id)
    if (!practice) {
      const newPractice = await createPracticeFromDraft({
        education_id: educationId,
        resource_id: res.id,
        title: `${res.name} Pratik & Kod`,
        completed: false,
        code: serializeCodeFiles([{
          name: 'Main.java',
          content: `// Pratik Kaynağı: ${res.name}\n// Bu kaynak için pratik kodlarınızı buraya yazın.\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe pratik basariyla olusturuldu.");\n    }\n}`
        }]),
        notes: getNoteForResource(res.id),
        order_index: practices.length + 1
      })
      const updatedPractices = [...practices, newPractice]
      savePractices(updatedPractices)
      practice = newPractice
    }

    setSelectedPracticeId(practice.id)
    setSelectedResourceId(res.id)
    
    if (task) {
      const codeFiles = serializeCodeFiles([{
        name: task.codeFileName,
        content: `// Pekiştirme Görevi: ${task.title}\n// Bu dosya pekiştirme için otomatik oluşturulmuştur.\n\npublic class ${task.codeFileName.replace('.java', '')} {\n    public static void main(String[] args) {\n        System.out.println("${task.title}");\n    }\n}`
      }])
      // If code already contains this file, don't overwrite it, just select it
      const currentFiles = JSON.parse(practice.code || '[]') as any[]
      const exists = currentFiles.some((f) => f.name === task.codeFileName)
      if (!exists) {
        const nextFiles = [...currentFiles, {
          name: task.codeFileName,
          content: `// Pekiştirme Görevi: ${task.title}\n// Bu dosya pekiştirme için otomatik oluşturulmuştur.\n\npublic class ${task.codeFileName.replace('.java', '')} {\n    public static void main(String[] args) {\n        System.out.println("${task.title}");\n    }\n}`
        }]
        void handleUpdatePractice(practice.id, { code: JSON.stringify(nextFiles) })
      }
      setActiveFileName(task.codeFileName)
    } else {
      setActiveFileName('Main.java')
    }

    setActiveTab('primary')
    setCodeDraft(null)
    toast.success('Pekiştirme kodu düzenleme modu aktif edildi.')
  }, [confirmNavigation, practices, educationId, getNoteForResource, createPracticeFromDraft, savePractices, setSelectedPracticeId, setSelectedResourceId, setActiveFileName, handleUpdatePractice, setActiveTab, setCodeDraft])

  const handleCreateReinforcementForResource = React.useCallback((resId: number) => {
    const title = window.prompt('Pekistirme basligi girin:', 'Yeni Pekistirme')?.trim()
    if (!title) return
    handleAddReinforceTask(resId, title)
    setSelectedResourceId(resId)
    setActiveTab('reinforce')
  }, [handleAddReinforceTask, setSelectedResourceId, setActiveTab])

  const handleRenameTask = React.useCallback((actualKey: string, taskId: string) => {
    const list = reinforcements[actualKey] || []
    const task = list.find(t => t.id === taskId)
    if (!task) return
    const newTitle = window.prompt('Pekiştirme görevi için yeni bir başlık girin:', task.title)
    if (newTitle && newTitle.trim()) {
      const updated = list.map(t => t.id === taskId ? { ...t, title: newTitle.trim() } : t)
      const updatedReinforcements = { ...reinforcements, [actualKey]: updated }
      saveReinforcements(updatedReinforcements)
      toast.success('Pekiştirme görevi adı güncellendi.')
    }
  }, [reinforcements, saveReinforcements])

  const handleDeleteTask = React.useCallback((actualKey: string, taskId: string) => {
    if (!window.confirm('Bu pekiştirme görevini silmek istediğinize emin misiniz?')) return
    const list = reinforcements[actualKey] || []
    const updated = list.filter(t => t.id !== taskId)
    const updatedReinforcements = { ...reinforcements, [actualKey]: updated }
    saveReinforcements(updatedReinforcements)
    toast.success('Pekiştirme görevi silindi.')
  }, [reinforcements, saveReinforcements])

  const handleRenameNote = React.useCallback((actualKey: string, noteId: string) => {
    const list = resourceNoteItems[actualKey] || []
    const note = list.find(n => n.id === noteId)
    if (!note) return
    const newTitle = window.prompt('Not için yeni bir başlık girin:', note.title)
    if (newTitle && newTitle.trim()) {
      const updated = list.map(n => n.id === noteId ? { ...n, title: newTitle.trim(), updatedAt: new Date().toISOString() } : n)
      const updatedNoteItems = { ...resourceNoteItems, [actualKey]: updated }
      saveResourceNoteItems(updatedNoteItems)
      if (activeResourceNoteId === noteId) {
        setNoteTitleDraft(newTitle.trim())
      }
      toast.success('Not adı güncellendi.')
    }
  }, [resourceNoteItems, saveResourceNoteItems, activeResourceNoteId, setNoteTitleDraft])

  const handleDeleteNote = React.useCallback((actualKey: string, noteId: string) => {
    if (!window.confirm('Bu notu silmek istediğinize emin misiniz?')) return
    const list = resourceNoteItems[actualKey] || []
    const updated = list.filter(n => n.id !== noteId)
    const updatedNoteItems = { ...resourceNoteItems, [actualKey]: updated }
    saveResourceNoteItems(updatedNoteItems)
    if (activeResourceNoteId === noteId) {
      setActiveResourceNoteId(null)
      setNoteTitleDraft('')
      setNotesDraft('')
    }
    toast.success('Not silindi.')
  }, [resourceNoteItems, saveResourceNoteItems, activeResourceNoteId, setActiveResourceNoteId, setNoteTitleDraft, setNotesDraft])

  return {
    practices,
    setPractices,
    selectedPracticeId,
    setSelectedPracticeId,
    selectedPractice,
    notesDraft,
    setNotesDraft,
    noteTitleDraft,
    setNoteTitleDraft,
    activeResourceNoteId,
    setActiveResourceNoteId,
    saveState,
    setSaveState,
    resourceNotes,
    setResourceNotes,
    resourceNoteItems,
    setResourceNoteItems,
    activeNotesResourceId,
    setActiveNotesResourceId,
    reinforcements,
    setReinforcements,
    activeReinforceResourceId,
    setActiveReinforceResourceId,
    newReinforcementTitle,
    setNewReinforcementTitle,
    getNoteForResource,
    createPracticeFromDraft,
    handleUpdatePractice,
    handleUpdateNoteForResource,
    handleCreateNoteForResource,
    handleDeleteNoteForResource,
    handleOpenNotesForResource,
    handleOpenCodeForResource,
    handleSaveNotes,
    handleAddReinforceTask,
    handleToggleReinforceTask,
    handleDeleteReinforceTask,
    handleWriteCodeForTarget,
    handleCreateReinforcementForResource,
    handleRenameTask,
    handleDeleteTask,
    handleRenameNote,
    handleDeleteNote,
  }
}
