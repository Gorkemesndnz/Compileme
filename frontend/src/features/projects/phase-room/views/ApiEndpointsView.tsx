import React, { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, Check, Loader2, Braces, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  Project,
  ProjectPhase,
  useProjectDocuments,
  useAddProjectDocument,
  useUpdateProjectDocument,
} from '../../../../api/projects'
import { Input } from '../../../../components/ui/Input'
import { Textarea } from '../../../../components/ui/Textarea'
import { cn } from '../../../../lib/utils'
import { SketchButton } from '../../../../components/ui/SketchButton'
import { Select } from '../../../../components/ui/Select'

export interface ApiEndpoint {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  title: string
  path: string
  requestBody: string
  responseBody: string
  notes: string
}

const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET', badgeClass: 'bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/20' },
  { label: 'POST', value: 'POST', badgeClass: 'bg-blue-100/60 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border border-blue-200/20' },
  { label: 'PUT', value: 'PUT', badgeClass: 'bg-amber-100/60 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/20' },
  { label: 'DELETE', value: 'DELETE', badgeClass: 'bg-rose-100/60 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 border border-rose-200/20' },
]

interface ApiEndpointsViewProps {
  project: Project
  phase: ProjectPhase
}

export const ApiEndpointsView: React.FC<ApiEndpointsViewProps> = ({
  project,
  phase,
}) => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([])
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch project documents
  const { data: documents = [] } = useProjectDocuments(project.id)
  const addDocMutation = useAddProjectDocument()
  const updateDocMutation = useUpdateProjectDocument()

  const docTitle = `API_ENDPOINTS_PHASE_${phase.id}`
  const endpointsDoc = documents.find(
    (doc) => doc.type === 'TECH_DOC' && doc.title === docTitle
  )

  // Sync with document content
  useEffect(() => {
    if (endpointsDoc && endpointsDoc.content) {
      try {
        const parsed = JSON.parse(endpointsDoc.content)
        if (Array.isArray(parsed)) {
          setEndpoints(parsed)
          if (parsed.length > 0 && !selectedEndpointId) {
            setSelectedEndpointId(parsed[0].id)
          }
        }
      } catch {
        console.error('Failed to parse endpoints JSON')
      }
    }
  }, [endpointsDoc?.id, endpointsDoc?.content])

  // Save array of endpoints to backend
  const saveEndpointsList = async (list: ApiEndpoint[]) => {
    setIsSaving(true)
    const content = JSON.stringify(list)
    try {
      if (endpointsDoc) {
        await updateDocMutation.mutateAsync({
          documentId: endpointsDoc.id,
          request: {
            type: 'TECH_DOC',
            title: docTitle,
            content,
            contentFormat: 'MARKDOWN',
          },
        })
      } else {
        await addDocMutation.mutateAsync({
          projectId: project.id,
          request: {
            type: 'TECH_DOC',
            title: docTitle,
            content,
            contentFormat: 'MARKDOWN',
            orderIndex: 90,
          },
        })
      }
    } catch {
      toast.error('Endpoints kaydedilirken bir hata oluştu.')
    } finally {
      setIsSaving(false)
    }
  }

  const triggerAutoSave = (updatedList: ApiEndpoint[]) => {
    setEndpoints(updatedList)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      saveEndpointsList(updatedList)
    }, 1500)
  }

  // Add new endpoint
  const handleAddEndpoint = () => {
    const newEndpoint: ApiEndpoint = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      method: 'GET',
      title: 'Yeni API Endpoint',
      path: '/api/resource',
      requestBody: '{}',
      responseBody: '{}',
      notes: '',
    }
    const updated = [...endpoints, newEndpoint]
    triggerAutoSave(updated)
    setSelectedEndpointId(newEndpoint.id)
    toast.success('Yeni API Endpoint eklendi.')
  }

  // Delete endpoint
  const handleDeleteEndpoint = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = endpoints.filter((ep) => ep.id !== id)
    triggerAutoSave(updated)
    if (selectedEndpointId === id) {
      setSelectedEndpointId(updated.length > 0 ? updated[0].id : null)
    }
    toast.success('Endpoint silindi.')
  }

  // Update specific endpoint fields
  const handleUpdateField = (id: string, fields: Partial<ApiEndpoint>) => {
    const updated = endpoints.map((ep) => {
      if (ep.id === id) {
        return { ...ep, ...fields }
      }
      return ep
    })
    triggerAutoSave(updated)
  }

  const selectedEndpoint = endpoints.find((ep) => ep.id === selectedEndpointId)

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Panel: Endpoints list */}
      <section className="lg:col-span-4 glass-panel rounded-3xl p-5 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl flex flex-col h-[650px]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Braces className="h-4.5 w-4.5 text-cyan-500" />
              API & Endpoints
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Bu fazın endpoint listesi.
            </p>
          </div>
          <button
            onClick={handleAddEndpoint}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            title="Yeni Endpoint Ekle"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
          {endpoints.map((ep) => {
            const methodColors = {
              GET: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400',
              POST: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
              PUT: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
              DELETE: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
            }

            return (
              <div
                key={ep.id}
                onClick={() => setSelectedEndpointId(ep.id)}
                className={cn(
                  'p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group',
                  selectedEndpointId === ep.id
                    ? 'border-cyan-500 bg-cyan-50/10 dark:border-cyan-500/40 dark:bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : 'border-zinc-200/50 bg-zinc-50/20 dark:border-zinc-800/40 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-lg text-[9px] font-black border tracking-wider',
                      methodColors[ep.method]
                    )}
                  >
                    {ep.method}
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {ep.title}
                    </span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">
                      {ep.path}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteEndpoint(ep.id, e)}
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Endpoint Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          {endpoints.length === 0 && (
            <div className="text-center py-12 border border-dashed border-zinc-200/50 dark:border-zinc-800/40 rounded-2xl">
              <p className="text-xs text-zinc-400 italic">Henüz endpoint eklenmemiş.</p>
            </div>
          )}
        </div>
      </section>

      {/* Right Panel: Detail view */}
      <section className="lg:col-span-8 glass-panel rounded-3xl p-6 border border-zinc-200/60 dark:border-zinc-800/40 backdrop-blur-xl h-[650px] flex flex-col">
        {selectedEndpoint ? (
          <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-y-auto pr-1">
            {/* Header / Save State */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Endpoint Detayları
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    Kaydedildi
                  </>
                )}
              </div>
            </div>

            {/* Input fields */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  HTTP Method
                </label>
                <Select
                  value={selectedEndpoint.method}
                  onChange={(val) =>
                    handleUpdateField(selectedEndpoint.id, {
                      method: val as ApiEndpoint['method'],
                    })
                  }
                  options={METHOD_OPTIONS}
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Başlık / Açıklama
                </label>
                <Input
                  value={selectedEndpoint.title}
                  onChange={(e) =>
                    handleUpdateField(selectedEndpoint.id, { title: e.target.value })
                  }
                  placeholder="Örn: Kullanıcı Listesini Getir"
                  className="h-9 text-xs"
                />
              </div>

              <div className="md:col-span-5">
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Endpoint Path (Yol)
                </label>
                <Input
                  value={selectedEndpoint.path}
                  onChange={(e) =>
                    handleUpdateField(selectedEndpoint.id, { path: e.target.value })
                  }
                  placeholder="Örn: /api/users"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            {/* Request & Response Bodies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Request Body (JSON)
                </label>
                <Textarea
                  value={selectedEndpoint.requestBody}
                  onChange={(e) =>
                    handleUpdateField(selectedEndpoint.id, { requestBody: e.target.value })
                  }
                  placeholder="{}"
                  className="min-h-[160px] w-full font-mono text-xs bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Response Body (JSON)
                </label>
                <Textarea
                  value={selectedEndpoint.responseBody}
                  onChange={(e) =>
                    handleUpdateField(selectedEndpoint.id, { responseBody: e.target.value })
                  }
                  placeholder="{}"
                  className="min-h-[160px] w-full font-mono text-xs bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                Geliştirici Notları
              </label>
              <Textarea
                value={selectedEndpoint.notes}
                onChange={(e) =>
                  handleUpdateField(selectedEndpoint.id, { notes: e.target.value })
                }
                placeholder="Bu endpoint için parametre notları, hata kodları vb..."
                className="flex-1 min-h-[120px] w-full text-xs bg-white/50 dark:bg-black/30 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <AlertCircle className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Seçili Endpoint Yok
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1">
              Detayları görüntülemek ve düzenlemek için soldaki listeden bir API seçin veya yeni bir tane oluşturun.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
