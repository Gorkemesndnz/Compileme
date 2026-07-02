import React from 'react'
import { toast } from 'sonner'
import {
  FolderData,
  EducationResource,
  EducationPractice,
} from '../../types'

interface EducationTaskContext {
  folderId?: string
  resourceId?: number
}

interface UseStudioTasksProps {
  educationId: number
  isPersistedEducation: boolean
  education: any
  selectedPractice: EducationPractice | undefined
  folders: FolderData[]
  resources: EducationResource[]
  dbTasks: any[]
  persistedTaskIds: Set<number>
  createTaskMutation: any
  toggleTaskMutation: any
  deleteTaskMutation: any
}

export const useStudioTasks = ({
  educationId,
  isPersistedEducation,
  education,
  selectedPractice,
  folders,
  resources,
  dbTasks,
  persistedTaskIds,
  createTaskMutation,
  toggleTaskMutation,
  deleteTaskMutation,
}: UseStudioTasksProps) => {
  const [localTasks, setLocalTasks] = React.useState<any[]>([])
  const [taskTitle, setTaskTitle] = React.useState('')
  const [taskDate, setTaskDate] = React.useState('')
  const [taskTime, setTaskTime] = React.useState('')
  const [taskFolderId, setTaskFolderId] = React.useState('')
  const [taskResourceId, setTaskResourceId] = React.useState<number | undefined>(undefined)
  const [taskContexts, setTaskContexts] = React.useState<Record<string, EducationTaskContext>>({})
  const [editingTaskId, setEditingTaskId] = React.useState<number | string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = React.useState('')

  const saveTaskContexts = React.useCallback((newContexts: Record<string, EducationTaskContext>) => {
    setTaskContexts(newContexts)
    localStorage.setItem(`education-task-context-${educationId}`, JSON.stringify(newContexts))
  }, [educationId])

  const getTaskContextLabel = React.useCallback((context?: EducationTaskContext) => {
    if (!context?.resourceId) return ''
    const resource = resources.find((item) => item.id === context.resourceId)
    if (!resource) return ''
    const folder = context.folderId
      ? folders.find((item) => item.id === context.folderId)
      : folders.find((item) => item.resourceIds.includes(resource.id))
    return folder ? `${folder.name} / ${resource.name}` : resource.name
  }, [folders, resources])

  const getCurrentTaskContext = React.useCallback((): EducationTaskContext => ({
    folderId: taskFolderId || undefined,
    resourceId: taskResourceId,
  }), [taskFolderId, taskResourceId])

  const handleAddTask = React.useCallback(async (e: React.FormEvent) => {
    if (e) e.preventDefault()
    const title = taskTitle.trim()
    if (!title) {
      toast.error('Görev başlığı girmelisiniz.')
      return
    }

    const taskContext = getCurrentTaskContext()
    const contextLabel = getTaskContextLabel(taskContext)
    const localTaskId = Date.now()
    const newTask = {
      id: localTaskId,
      title,
      status: 'TODO' as const,
      scheduledDate: taskDate,
      scheduledTime: taskTime,
      tag: contextLabel || education?.title || 'Java Spring Boot'
    }

    const updated = [newTask, ...localTasks]
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    if (taskContext.folderId || taskContext.resourceId) {
      saveTaskContexts({ ...taskContexts, [String(localTaskId)]: taskContext })
    }

    if (isPersistedEducation) {
      try {
        const createdTask = await createTaskMutation.mutateAsync({
          title,
          notes: `${education?.title || 'Java Spring Boot'} / ${selectedPractice?.title || 'Genel Etüt'}`,
          status: 'TODO',
          kind: 'EDUCATION',
          scheduledDate: taskDate || undefined,
          scheduledTime: taskTime || undefined,
          planningBucket: taskDate ? 'DAY' : 'UNSCHEDULED',
          educationId: educationId,
        })
        const syncedTasks = updated.map((task) => task.id === localTaskId ? { ...task, id: createdTask.id } : task)
        setLocalTasks(syncedTasks)
        localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(syncedTasks))
        if (taskContext.folderId || taskContext.resourceId) {
          const nextContexts = { ...taskContexts }
          delete nextContexts[String(localTaskId)]
          nextContexts[String(createdTask.id)] = taskContext
          saveTaskContexts(nextContexts)
        }
      } catch {
        // Suppress backend error to remain fully responsive locally
      }
    } else {
      toast.info('Bu egitim henuz veritabaninda yok; gorev yerel demo listesine eklendi.')
    }

    setTaskTitle('')
    setTaskDate('')
    setTaskTime('')
    setTaskResourceId(undefined)
    toast.success('Çalışma görevi eklendi.')
  }, [taskTitle, taskDate, taskTime, localTasks, educationId, taskContexts, isPersistedEducation, education, selectedPractice, createTaskMutation, saveTaskContexts, getCurrentTaskContext, getTaskContextLabel])

  const handleToggleLocalTask = React.useCallback(async (id: number | string) => {
    const updated = localTasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'DONE' ? 'TODO' : 'DONE' }
      }
      return t
    })
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    toast.success('Görev durumu güncellendi.')

    if (typeof id === 'number' && persistedTaskIds.has(id)) {
      try {
        await toggleTaskMutation.mutateAsync(id)
      } catch {
        // Silently allow local state only
      }
    }
  }, [localTasks, educationId, persistedTaskIds, toggleTaskMutation])

  const handleSaveLocalTaskEdit = React.useCallback((id: number | string) => {
    const title = editingTaskTitle.trim()
    if (!title) {
      toast.error('Görev başlığı boş olamaz.')
      return
    }
    const updated = localTasks.map(t => {
      if (t.id === id) {
        return { ...t, title }
      }
      return t
    })
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    setEditingTaskId(null)
    toast.success('Görev güncellendi.')
  }, [editingTaskTitle, localTasks, educationId])

  const handleDeleteLocalTask = React.useCallback(async (id: number | string) => {
    const updated = localTasks.filter(t => t.id !== id)
    setLocalTasks(updated)
    localStorage.setItem(`local-tasks-${educationId}`, JSON.stringify(updated))
    toast.success('Görev silindi.')

    if (typeof id === 'number' && persistedTaskIds.has(id)) {
      try {
        await deleteTaskMutation.mutateAsync(id)
      } catch {
        // Silently allow local state only
      }
    }
  }, [localTasks, educationId, persistedTaskIds, deleteTaskMutation])

  return {
    localTasks,
    setLocalTasks,
    taskTitle,
    setTaskTitle,
    taskDate,
    setTaskDate,
    taskTime,
    setTaskTime,
    taskFolderId,
    setTaskFolderId,
    taskResourceId,
    setTaskResourceId,
    taskContexts,
    setTaskContexts,
    editingTaskId,
    setEditingTaskId,
    editingTaskTitle,
    setEditingTaskTitle,
    getTaskContextLabel,
    handleAddTask,
    handleToggleLocalTask,
    handleSaveLocalTaskEdit,
    handleDeleteLocalTask,
  }
}
