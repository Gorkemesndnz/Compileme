import React from 'react'
import { toast } from 'sonner'
import { useEducationTreeStore } from '@/store/useEducationTreeStore'
import {
  EducationResource,
  FolderData,
  EducationPractice,
} from '../../types'
import {
  toLocalResource,
  getDefaultFolderIdForResource,
  reconcileFoldersWithResources,
} from '../../components/studioHelpers'

interface UseStudioFoldersProps {
  educationId: number
  isPersistedEducation: boolean
  resources: EducationResource[]
  setResources: React.Dispatch<React.SetStateAction<EducationResource[]>>
  practices: EducationPractice[]
  setPractices: React.Dispatch<React.SetStateAction<EducationPractice[]>>
  selectedResourceId: number | null | undefined
  setSelectedResourceId: React.Dispatch<React.SetStateAction<number | null | undefined>>
  selectedPracticeId: number | null
  setSelectedPracticeId: React.Dispatch<React.SetStateAction<number | null>>
  activeTab: string
  setActiveTab: React.Dispatch<React.SetStateAction<any>>
  reinforcements: Record<string, any[]>
  setReinforcements: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
  resourceNoteItems: Record<string, any[]>
  setResourceNoteItems: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
  createResourceMutation: any
  deleteResourceMutation: any
  updateResourceMutation: any
  reorderResourcesMutation: any
  uploadFileMutation: any
  activeResourceNoteId: string | null
  setActiveResourceNoteId: React.Dispatch<React.SetStateAction<string | null>>
  setNoteTitleDraft: React.Dispatch<React.SetStateAction<string>>
  setNotesDraft: React.Dispatch<React.SetStateAction<string>>
}

export const useStudioFolders = ({
  educationId,
  isPersistedEducation,
  resources,
  setResources,
  practices,
  setPractices,
  selectedResourceId,
  setSelectedResourceId,
  selectedPracticeId,
  setSelectedPracticeId,
  activeTab,
  setActiveTab,
  reinforcements,
  setReinforcements,
  resourceNoteItems,
  setResourceNoteItems,
  createResourceMutation,
  deleteResourceMutation,
  updateResourceMutation,
  reorderResourcesMutation,
  uploadFileMutation,
  activeResourceNoteId,
  setActiveResourceNoteId,
  setNoteTitleDraft,
  setNotesDraft,
}: UseStudioFoldersProps) => {
  const [folders, setFolders] = React.useState<FolderData[]>([])
  const [foldersOpen, setFoldersOpen] = React.useState<Record<string, boolean>>({
    'folder-pdf': true,
    'folder-link': true,
  })
  const [selectedFolderId, setSelectedFolderId] = React.useState('')
  const [isFolderCreatorOpen, setIsFolderCreatorOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState('')
  const [isLinkAdderOpen, setIsLinkAdderOpen] = React.useState(false)
  const [newLinkName, setNewLinkName] = React.useState('')
  const [newLinkUrl, setNewLinkUrl] = React.useState('')
  const [completedResources, setCompletedResources] = React.useState<Record<number, boolean>>({})
  const [replacingResourceId, setReplacingResourceId] = React.useState<number | null>(null)
  
  // Drag & Drop States
  const [draggedFolderIndex, setDraggedFolderIndex] = React.useState<number | null>(null)
  const [draggedResourceInfo, setDraggedResourceInfo] = React.useState<{ folderId: string; resourceId: number } | null>(null)

  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    isOpen: boolean
    type: 'folder' | 'resource'
    targetId: string | number
    title: string
    warningText: string
  } | null>(null)

  const treeExpandedNodes = useEducationTreeStore((state) => state.expandedNodes)
  const handleToggleTreeNode = useEducationTreeStore((state) => state.toggleNode)
  const [treeLoadingNodes, setTreeLoadingNodes] = React.useState<Record<string, boolean>>({})

  const saveResources = React.useCallback((newResources: EducationResource[]) => {
    setResources(newResources)
    if (!isPersistedEducation) {
      localStorage.setItem(`resources-${educationId}`, JSON.stringify(newResources))
    }
  }, [isPersistedEducation, educationId, setResources])

  const saveFolders = React.useCallback((newFolders: FolderData[]) => {
    setFolders(newFolders)
    localStorage.setItem(`folders-${educationId}`, JSON.stringify(newFolders))
  }, [educationId])

  const saveCompletedResources = React.useCallback((newCompleted: Record<number, boolean>) => {
    setCompletedResources(newCompleted)
    localStorage.setItem(`completed-resources-${educationId}`, JSON.stringify(newCompleted))
  }, [educationId])

  const toggleFolderState = React.useCallback((folderId: string) => {
    setFoldersOpen(prev => ({ ...prev, [folderId]: !prev[folderId] }))
  }, [])

  const handleCreateFolder = React.useCallback(() => {
    const name = newFolderName.trim()
    if (!name) {
      toast.error('Klasör adı boş olamaz.')
      return
    }
    const newFolder: FolderData = {
      id: `folder-${Date.now()}`,
      name,
      resourceIds: [],
    }
    const updatedFolders = [...folders, newFolder]
    saveFolders(updatedFolders)
    setNewFolderName('')
    setIsFolderCreatorOpen(false)
    toast.success('Yeni klasör oluşturuldu.')
  }, [folders, newFolderName, saveFolders])

  const handleRenameFolder = React.useCallback((folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return
    const newName = window.prompt('Klasör için yeni bir isim girin:', folder.name)
    if (newName && newName.trim()) {
      const updated = folders.map(f => f.id === folderId ? { ...f, name: newName.trim() } : f)
      saveFolders(updated)
      toast.success('Klasör adı güncellendi.')
    }
  }, [folders, saveFolders])

  const executeDeleteFolder = React.useCallback(async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    let updatedResources = [...resources]
    let updatedPractices = [...practices]
    let updatedReinforcements = { ...reinforcements }
    let updatedNoteItems = { ...resourceNoteItems }

    if (isPersistedEducation) {
      await Promise.all(folder.resourceIds.map((resId) => deleteResourceMutation.mutateAsync(resId)))
    }

    folder.resourceIds.forEach((resId) => {
      updatedResources = updatedResources.filter(r => r.id !== resId)
      updatedPractices = updatedPractices.filter(p => p.resource_id !== resId)
      delete updatedReinforcements[`resource:${resId}`]
      delete updatedReinforcements[String(resId)]
      delete updatedNoteItems[`resource:${resId}`]
      delete updatedNoteItems[String(resId)]
    })

    const updatedFolders = folders.filter(f => f.id !== folderId)
    saveFolders(updatedFolders)
    saveResources(updatedResources)
    setPractices(updatedPractices)
    setReinforcements(updatedReinforcements)
    setResourceNoteItems(updatedNoteItems)
    toast.success('Klasör ve altındaki tüm içerikler silindi.')
  }, [folders, resources, practices, reinforcements, resourceNoteItems, isPersistedEducation, deleteResourceMutation, saveFolders, saveResources, setPractices, setReinforcements, setResourceNoteItems])

  const handleDeleteFolder = React.useCallback((folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (!folder) return

    const fileCount = folder.resourceIds.length
    let taskCount = 0
    let noteCount = 0

    folder.resourceIds.forEach((resId) => {
      const actualTaskKey = reinforcements[`resource:${resId}`] ? `resource:${resId}` : (reinforcements[String(resId)] ? String(resId) : `resource:${resId}`)
      taskCount += (reinforcements[actualTaskKey] || []).length

      const actualNoteKey = resourceNoteItems[`resource:${resId}`] ? `resource:${resId}` : (resourceNoteItems[String(resId)] ? String(resId) : `resource:${resId}`)
      noteCount += (resourceNoteItems[actualNoteKey] || []).length
    })

    if (fileCount > 0 || taskCount > 0 || noteCount > 0) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'folder',
        targetId: folderId,
        title: `"${folder.name}" Klasörünü Sil`,
        warningText: `Bu klasörü silmek altındaki ${fileCount} dosyayı, ${taskCount} pekiştirme görevini ve ${noteCount} notu kalıcı olarak silecektir. Devam etmek istiyor musunuz?`
      })
    } else {
      if (window.confirm('Bu boş klasörü silmek istediğinize emin misiniz?')) {
        void executeDeleteFolder(folderId)
      }
    }
  }, [folders, reinforcements, resourceNoteItems, executeDeleteFolder])

  const executeDeleteResource = React.useCallback(async (resId: number) => {
    if (isPersistedEducation) {
      await deleteResourceMutation.mutateAsync(resId)
    }

    const updatedResources = resources.filter(r => r.id !== resId)
    const updatedPractices = practices.filter(p => p.resource_id !== resId)

    const updatedReinforcements = { ...reinforcements }
    delete updatedReinforcements[`resource:${resId}`]
    delete updatedReinforcements[String(resId)]

    const updatedNoteItems = { ...resourceNoteItems }
    delete updatedNoteItems[`resource:${resId}`]
    delete updatedNoteItems[String(resId)]

    const updatedFolders = folders.map(f => ({
      ...f,
      resourceIds: f.resourceIds.filter(id => id !== resId)
    }))

    saveFolders(updatedFolders)
    saveResources(updatedResources)
    setPractices(updatedPractices)
    setReinforcements(updatedReinforcements)
    setResourceNoteItems(updatedNoteItems)

    if (selectedResourceId === resId) {
      setSelectedResourceId(null)
      setSelectedPracticeId(null)
    }
    toast.success('Dosya silindi.')
  }, [isPersistedEducation, deleteResourceMutation, resources, practices, reinforcements, resourceNoteItems, folders, selectedResourceId, saveFolders, saveResources, setPractices, setReinforcements, setResourceNoteItems, setSelectedResourceId, setSelectedPracticeId])

  const handleDeleteResource = React.useCallback((resId: number) => {
    const res = resources.find(r => r.id === resId)
    if (!res) return

    const actualTaskKey = reinforcements[`resource:${resId}`] ? `resource:${resId}` : (reinforcements[String(resId)] ? String(resId) : `resource:${resId}`)
    const taskCount = (reinforcements[actualTaskKey] || []).length

    const actualNoteKey = resourceNoteItems[`resource:${resId}`] ? `resource:${resId}` : (resourceNoteItems[String(resId)] ? String(resId) : `resource:${resId}`)
    const noteCount = (resourceNoteItems[actualNoteKey] || []).length

    if (taskCount > 0 || noteCount > 0) {
      setDeleteConfirmation({
        isOpen: true,
        type: 'resource',
        targetId: resId,
        title: `"${res.name}" Dosyasını Sil`,
        warningText: `Bu dosyayı silmek bağlı olan ${taskCount} pekiştirme görevini ve ${noteCount} notu kalıcı olarak silecektir. Devam etmek istiyor musunuz?`
      })
    } else {
      if (window.confirm('Bu dosyayı silmek istediğinize emin misiniz?')) {
        void executeDeleteResource(resId)
      }
    }
  }, [resources, reinforcements, resourceNoteItems, executeDeleteResource])

  const handleRenameResourceLocal = React.useCallback((resId: number) => {
    const res = resources.find(r => r.id === resId)
    if (!res) return
    const newName = window.prompt('Dosya için yeni bir isim girin:', res.name)
    if (newName && newName.trim()) {
      const updated = resources.map(r => r.id === resId ? { ...r, name: newName.trim() } : r)
      saveResources(updated)
      toast.success('Dosya adı güncellendi.')
    }
  }, [resources, saveResources])

  const handleRenameResource = React.useCallback((resId: number) => {
    const resource = resources.find((item) => item.id === resId)
    if (!resource) return
    const newName = window.prompt('Dosya icin yeni bir isim girin:', resource.name)
    const trimmedName = newName?.trim()
    if (!trimmedName || trimmedName === resource.name) return

    const updated = resources.map((item) => item.id === resId ? { ...item, name: trimmedName } : item)
    saveResources(updated)
    if (isPersistedEducation) {
      void updateResourceMutation.mutateAsync({
        id: resId,
        request: { name: trimmedName },
      }).catch(() => {
        toast.error('Dosya adi kaydedilemedi.')
      })
    }
    toast.success('Dosya adi guncellendi.')
  }, [isPersistedEducation, resources, saveResources, updateResourceMutation])

  const addResourcesToFolder = React.useCallback((resourceItems: EducationResource[]) => {
    if (resourceItems.length === 0) return

    const resourceIdsByFolder = resourceItems.reduce<Record<string, number[]>>((acc, resource) => {
      const targetFolderId = selectedFolderId && selectedFolderId !== 'uncategorized'
        ? selectedFolderId
        : getDefaultFolderIdForResource(resource)
      acc[targetFolderId] = [...(acc[targetFolderId] || []), resource.id]
      return acc
    }, {})

    const updatedFolders = folders.map((folder) => {
      const idsToAdd = resourceIdsByFolder[folder.id] || []
      if (idsToAdd.length === 0) return folder
      return {
        ...folder,
        resourceIds: Array.from(new Set([...folder.resourceIds, ...idsToAdd])),
      }
    })

    saveFolders(updatedFolders)
  }, [folders, selectedFolderId, saveFolders])

  const getPersistedResourceOrder = React.useCallback((nextFolders: FolderData[], nextResources: EducationResource[]) => {
    const resourceById = new Map(nextResources.map((resource) => [resource.id, resource]))
    const orderedIds = nextFolders.flatMap((folder) => folder.resourceIds)
    const orderedSet = new Set(orderedIds)
    const uncategorizedIds = nextResources
      .filter((resource) => !orderedSet.has(resource.id))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
      .map((resource) => resource.id)

    return [...orderedIds, ...uncategorizedIds]
      .filter((id) => resourceById.has(id))
      .map((id, index) => ({ id, orderIndex: index }))
  }, [])

  const persistResourceOrder = React.useCallback((nextFolders: FolderData[], nextResources: EducationResource[]) => {
    const orderItems = getPersistedResourceOrder(nextFolders, nextResources)
    const orderMap = new Map(orderItems.map((item) => [item.id, item.orderIndex]))
    const orderedResources = nextResources
      .map((resource) => ({
        ...resource,
        order_index: orderMap.get(resource.id) ?? resource.order_index,
      }))
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

    saveResources(orderedResources)
    if (isPersistedEducation) {
      void reorderResourcesMutation.mutateAsync(orderItems).catch(() => {
        toast.error('Kaynak siralamasi kaydedilemedi.')
      })
    }
    return orderedResources
  }, [getPersistedResourceOrder, isPersistedEducation, reorderResourcesMutation, saveResources])

  const toggleResourceCompleted = React.useCallback((resourceId: number) => {
    const resource = resources.find((item) => item.id === resourceId)
    if (!resource) return

    const nextCompleted = !completedResources[resourceId]
    const nextCompletedMap = { ...completedResources, [resourceId]: nextCompleted }
    const nextResources = resources.map((item) =>
      item.id === resourceId ? { ...item, completed: nextCompleted } : item
    )

    saveCompletedResources(nextCompletedMap)
    saveResources(nextResources)
    if (isPersistedEducation) {
      void updateResourceMutation.mutateAsync({
        id: resourceId,
        request: { completed: nextCompleted },
      }).catch(() => {
        toast.error('Tamamlanma durumu kaydedilemedi.')
      })
    }
  }, [completedResources, isPersistedEducation, resources, saveCompletedResources, saveResources, updateResourceMutation])

  const moveResourceWithinFolder = React.useCallback((folderId: string, resourceId: number, direction: 'up' | 'down') => {
    const folder = folders.find((item) => item.id === folderId)
    if (!folder) return

    const currentIndex = folder.resourceIds.indexOf(resourceId)
    if (currentIndex < 0) return
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= folder.resourceIds.length) return

    const nextResourceIds = [...folder.resourceIds]
    const [moved] = nextResourceIds.splice(currentIndex, 1)
    nextResourceIds.splice(nextIndex, 0, moved)

    const nextFolders = folders.map((item) =>
      item.id === folderId ? { ...item, resourceIds: nextResourceIds } : item
    )
    saveFolders(nextFolders)
    persistResourceOrder(nextFolders, resources)
  }, [folders, persistResourceOrder, resources, saveFolders])

  const handleSingleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      let urlOrPath = ''
      if (isPersistedEducation) {
        const formData = new FormData()
        formData.append('file', file)
        const response = await uploadFileMutation.mutateAsync(formData)
        urlOrPath = `/api/files/${response.id}`
      } else {
        urlOrPath = URL.createObjectURL(file)
      }

      if (replacingResourceId !== null) {
        // Replace existing file
        const updated = resources.map(r =>
          r.id === replacingResourceId
            ? { ...r, name: file.name, url_or_path: urlOrPath }
            : r
        )
        saveResources(updated)
        if (isPersistedEducation) {
          await updateResourceMutation.mutateAsync({
            id: replacingResourceId,
            request: { name: file.name, urlOrPath },
          })
        }
        setReplacingResourceId(null)
        toast.success('Dosya başarıyla değiştirildi.')
      } else {
        // Create new resource
        const type = file.name.endsWith('.pdf') ? 'PDF' : file.name.match(/\.(ppt|pptx)$/) ? 'SLIDE' : 'FILE'
        const request = {
          name: file.name,
          type,
          urlOrPath,
          orderIndex: resources.length,
        }

        let newRes: EducationResource
        if (isPersistedEducation) {
          const apiRes = await createResourceMutation.mutateAsync(request)
          newRes = toLocalResource(apiRes)
        } else {
          newRes = {
            id: Date.now(),
            education_id: educationId,
            name: file.name,
            type,
            url_or_path: urlOrPath,
            order_index: resources.length,
          }
        }

        const updated = [...resources, newRes]
        saveResources(updated)
        addResourcesToFolder([newRes])
        toast.success('Dosya başarıyla yüklendi.')
      }
    } catch {
      toast.error('Dosya yüklenirken hata oluştu.')
    } finally {
      if (e.target) e.target.value = ''
    }
  }, [isPersistedEducation, replacingResourceId, resources, educationId, uploadFileMutation, createResourceMutation, updateResourceMutation, saveResources, addResourcesToFolder])

  const handleFileUpload = React.useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (replacingResourceId !== null) {
      await handleSingleFileUpload(e)
      return
    }

    try {
      const newResourcesList: EducationResource[] = []

      for (const [index, file] of files.entries()) {
        let urlOrPath = ''
        if (isPersistedEducation) {
          const formData = new FormData()
          formData.append('file', file)
          const response = await uploadFileMutation.mutateAsync(formData)
          urlOrPath = `/api/files/${response.id}`
        } else {
          urlOrPath = URL.createObjectURL(file)
        }

        const lowerName = file.name.toLowerCase()
        const type = lowerName.endsWith('.pdf') ? 'PDF' : lowerName.match(/\.(ppt|pptx)$/) ? 'SLIDE' : 'FILE'
        const request = {
          name: file.name,
          type,
          urlOrPath,
          orderIndex: resources.length + index,
          completed: false,
        }

        if (isPersistedEducation) {
          const apiRes = await createResourceMutation.mutateAsync(request)
          newResourcesList.push(toLocalResource(apiRes))
        } else {
          newResourcesList.push({
            id: Date.now() + index,
            education_id: educationId,
            name: file.name,
            type,
            url_or_path: urlOrPath,
            order_index: resources.length + index,
            completed: false,
          })
        }
      }

      const updated = [...resources, ...newResourcesList]
      saveResources(updated)
      addResourcesToFolder(newResourcesList)
      toast.success(`${newResourcesList.length} dosya basariyla yuklendi.`)
    } catch {
      toast.error('Dosya yuklenirken hata olustu.')
    } finally {
      if (e.target) e.target.value = ''
    }
  }, [addResourcesToFolder, createResourceMutation, educationId, handleSingleFileUpload, isPersistedEducation, replacingResourceId, resources, saveResources, uploadFileMutation])

  const handleAddLink = React.useCallback(async () => {
    const name = newLinkName.trim()
    const url = newLinkUrl.trim()

    if (!name || !url) {
      toast.error('Lütfen bağlantı adı ve URL girin.')
      return
    }

    try {
      const request = {
        name,
        type: 'LINK' as const,
        urlOrPath: url,
        orderIndex: resources.length,
        completed: false,
      }

      let newRes: EducationResource
      if (isPersistedEducation) {
        const apiRes = await createResourceMutation.mutateAsync(request)
        newRes = toLocalResource(apiRes)
      } else {
        newRes = {
          id: Date.now(),
          education_id: educationId,
          name,
          type: 'LINK',
          url_or_path: url,
          order_index: resources.length,
          completed: false,
        }
      }

      const updated = [...resources, newRes]
      saveResources(updated)
      addResourcesToFolder([newRes])
      setNewLinkName('')
      setNewLinkUrl('')
      setIsLinkAdderOpen(false)
      toast.success('Bağlantı başarıyla eklendi.')
    } catch {
      toast.error('Bağlantı eklenirken hata oluştu.')
    }
  }, [isPersistedEducation, newLinkName, newLinkUrl, resources, educationId, createResourceMutation, saveResources, addResourcesToFolder])

  const handleImportCurriculum = React.useCallback(async (importText: string) => {
    const lines = importText.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length === 0) {
      toast.error('Müfredat içeriği boş olamaz.')
      return
    }

    try {
      const newResourcesList: EducationResource[] = []
      if (isPersistedEducation) {
        await Promise.all(
          lines.map(async (line, index) => {
            const apiRes = await createResourceMutation.mutateAsync({
              name: line,
              type: 'FILE',
              urlOrPath: '#',
              orderIndex: resources.length + index,
              completed: false,
            })
            newResourcesList.push(toLocalResource(apiRes))
          })
        )
      } else {
        lines.forEach((line, index) => {
          newResourcesList.push({
            id: Date.now() + index,
            education_id: educationId,
            name: line,
            type: 'FILE',
            url_or_path: '#',
            order_index: resources.length + index,
            completed: false,
          })
        })
      }

      const updated = [...resources, ...newResourcesList]
      saveResources(updated)
      addResourcesToFolder(newResourcesList)
      toast.success(`${lines.length} müfredat konusu başarıyla eklendi.`)
    } catch {
      toast.error('Müfredat eklenirken hata oluştu.')
    }
  }, [isPersistedEducation, resources, educationId, createResourceMutation, saveResources, addResourcesToFolder])

  const handleConfirmDelete = React.useCallback(() => {
    if (!deleteConfirmation) return
    const { type, targetId } = deleteConfirmation
    if (type === 'folder') {
      void executeDeleteFolder(String(targetId))
    } else {
      void executeDeleteResource(Number(targetId))
    }
    setDeleteConfirmation(null)
  }, [deleteConfirmation, executeDeleteFolder, executeDeleteResource])

  return {
    folders,
    setFolders,
    foldersOpen,
    setFoldersOpen,
    selectedFolderId,
    setSelectedFolderId,
    isFolderCreatorOpen,
    setIsFolderCreatorOpen,
    newFolderName,
    setNewFolderName,
    isLinkAdderOpen,
    setIsLinkAdderOpen,
    newLinkName,
    setNewLinkName,
    newLinkUrl,
    setNewLinkUrl,
    completedResources,
    setCompletedResources,
    replacingResourceId,
    setReplacingResourceId,
    draggedFolderIndex,
    setDraggedFolderIndex,
    draggedResourceInfo,
    setDraggedResourceInfo,
    deleteConfirmation,
    setDeleteConfirmation,
    treeExpandedNodes,
    treeLoadingNodes,
    setTreeLoadingNodes,
    handleToggleTreeNode,
    saveResources,
    saveFolders,
    saveCompletedResources,
    toggleFolderState,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    handleRenameResource,
    handleDeleteResource,
    executeDeleteFolder,
    executeDeleteResource,
    handleFileUpload,
    handleAddLink,
    handleImportCurriculum,
    handleConfirmDelete,
    addResourcesToFolder,
    toggleResourceCompleted,
    moveResourceWithinFolder,
    persistResourceOrder,
  }
}
