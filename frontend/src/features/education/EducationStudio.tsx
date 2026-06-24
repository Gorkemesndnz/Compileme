import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  Braces,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  FileText,
  FolderOpen,
  Link as LinkIcon,
  Plus,
  Save,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/api/client'
import { useCreateTask } from '@/api/tasks'
import { PageHeader } from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { mockEducationPractices, mockEducationResources, mockEducations } from './mockEducationData'
import {
  CodeFile,
  Education,
  EducationPractice,
  EducationResource,
  EducationResourceType,
  LanguageLevel,
  VocabularyCard,
  VocabularyType,
} from './types'

interface PracticeUpdateInput {
  title?: string
  completed?: boolean
  code?: string
  notes?: string
  resourceId?: number | null
}

interface PracticeUpdatePayload {
  title: string
  completed: boolean
  code: string
  notes: string
  resourceId: number | null
  orderIndex: number
}

const defaultCodeFiles: CodeFile[] = [
  {
    name: 'Main.java',
    content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe practice");\n    }\n}',
  },
]

const parseCodeFiles = (rawCode: string): CodeFile[] => {
  if (!rawCode.trim()) {
    return defaultCodeFiles
  }

  try {
    const parsed = JSON.parse(rawCode) as unknown
    if (
      Array.isArray(parsed) &&
      parsed.every((file) => {
        return (
          typeof file === 'object' &&
          file !== null &&
          'name' in file &&
          'content' in file &&
          typeof (file as CodeFile).name === 'string' &&
          typeof (file as CodeFile).content === 'string'
        )
      })
    ) {
      return parsed as CodeFile[]
    }
  } catch {
    return [{ name: 'Main.java', content: rawCode }]
  }

  return [{ name: 'Main.java', content: rawCode }]
}

const serializeCodeFiles = (files: CodeFile[]) => JSON.stringify(files)

const buildLineNumbers = (content: string) => {
  const count = Math.max(content.split('\n').length, 12)
  return Array.from({ length: count }, (_, index) => index + 1)
}

const createPracticePayload = (practice: EducationPractice, input: PracticeUpdateInput): PracticeUpdatePayload => ({
  title: input.title ?? practice.title,
  completed: input.completed ?? practice.completed,
  code: input.code ?? practice.code,
  notes: input.notes ?? practice.notes,
  resourceId: input.resourceId ?? practice.resource_id,
  orderIndex: practice.order_index ?? 0,
})

const ResourceIcon: React.FC<{ type: EducationResourceType }> = ({ type }) => {
  return type === 'PDF' ? (
    <FileText className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
  ) : (
    <LinkIcon className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
  )
}

const LANGUAGE_LEVELS: Array<{ id: LanguageLevel; label: string; shortLabel: string }> = [
  { id: 'A1_A2', label: 'A1-A2 Baslangic', shortLabel: 'A1-A2' },
  { id: 'B1', label: 'B1 Orta Seviye', shortLabel: 'B1' },
  { id: 'B2', label: 'B2 Ileri Orta', shortLabel: 'B2' },
  { id: 'C1_C2', label: 'C1-C2 Ileri', shortLabel: 'C1-C2' },
]

const VOCABULARY_TYPES: VocabularyType[] = ['Noun', 'Verb', 'Adj']

const getPracticeLevel = (practice: EducationPractice): LanguageLevel => {
  if (practice.title.includes('[B1]')) return 'B1'
  if (practice.title.includes('[B2]')) return 'B2'
  if (practice.title.includes('[C1_C2]')) return 'C1_C2'
  return 'A1_A2'
}

const parseVocabulary = (rawCode: string): VocabularyCard[] => {
  if (!rawCode.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(rawCode) as unknown
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => {
        return (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          'word' in item &&
          'meaning' in item &&
          'type' in item &&
          'box' in item &&
          'nextReview' in item
        )
      })
    ) {
      return parsed as VocabularyCard[]
    }
  } catch {
    return []
  }

  return []
}

const serializeVocabulary = (cards: VocabularyCard[]) => JSON.stringify(cards)

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

const getNextReviewDate = (box: VocabularyCard['box']) => {
  const intervals: Record<VocabularyCard['box'], number> = {
    1: 1,
    2: 3,
    3: 7,
  }
  return addDays(new Date(), intervals[box])
}

interface ProgrammingStudioProps {
  education: Education
  initialResources: EducationResource[]
  initialPractices: EducationPractice[]
}

const ProgrammingStudio: React.FC<ProgrammingStudioProps> = ({ education, initialResources, initialPractices }) => {
  const createTaskMutation = useCreateTask()
  const [resources, setResources] = React.useState<EducationResource[]>(initialResources)
  const [practices, setPractices] = React.useState<EducationPractice[]>(initialPractices)
  const [selectedPracticeId, setSelectedPracticeId] = React.useState<number | null>(initialPractices[0]?.id ?? null)
  const [activeFileName, setActiveFileName] = React.useState<string>('')
  const [isImporterOpen, setIsImporterOpen] = React.useState(false)
  const [importText, setImportText] = React.useState('')
  const [lastPayload, setLastPayload] = React.useState<PracticeUpdatePayload | null>(null)

  const selectedPractice = React.useMemo(
    () => practices.find((practice) => practice.id === selectedPracticeId) ?? practices[0],
    [practices, selectedPracticeId]
  )
  const codeFiles = React.useMemo(
    () => (selectedPractice ? parseCodeFiles(selectedPractice.code) : defaultCodeFiles),
    [selectedPractice]
  )
  const activeFile = React.useMemo(() => {
    return codeFiles.find((file) => file.name === activeFileName) ?? codeFiles[0]
  }, [activeFileName, codeFiles])
  const linkedPractices = React.useMemo(() => {
    return resources.map((resource) => ({
      resource,
      practices: practices.filter((practice) => practice.resource_id === resource.id),
    }))
  }, [resources, practices])
  const generalPractices = React.useMemo(
    () => practices.filter((practice) => practice.resource_id === null),
    [practices]
  )

  React.useEffect(() => {
    if (!activeFileName && codeFiles[0]) {
      setActiveFileName(codeFiles[0].name)
    }
  }, [activeFileName, codeFiles])

  React.useEffect(() => {
    if (activeFile && !codeFiles.some((file) => file.name === activeFileName)) {
      setActiveFileName(activeFile.name)
    }
  }, [activeFile, activeFileName, codeFiles])

  const handleUpdatePractice = React.useCallback(
    async (practiceId: number, updatedData: PracticeUpdateInput) => {
      const currentPractice = practices.find((practice) => practice.id === practiceId)
      if (!currentPractice) {
        toast.error('Pratik bulunamadi.')
        return null
      }

      const payload = createPracticePayload(currentPractice, updatedData)
      setLastPayload(payload)
      setPractices((current) =>
        current.map((practice) =>
          practice.id === practiceId
            ? {
                ...practice,
                title: payload.title,
                completed: payload.completed,
                code: payload.code,
                notes: payload.notes,
                resource_id: payload.resourceId,
              }
            : practice
        )
      )

      return payload
    },
    [practices]
  )

  const handlePersistPractice = async () => {
    if (!selectedPractice) {
      toast.error('Kaydedilecek pratik secili degil.')
      return
    }

    const payload = lastPayload ?? createPracticePayload(selectedPractice, {})
    try {
      await apiClient.patch(`/educations/practices/${selectedPractice.id}`, {
        title: payload.title,
        completed: payload.completed,
        code: payload.code,
        notes: payload.notes,
        resourceId: payload.resourceId,
        orderIndex: payload.orderIndex,
      })
      toast.success('Pratik guncelleme paketi kaydedildi.')
    } catch (error) {
      toast.error('Backend kaydi basarisiz. Degisiklik local state icinde korundu.')
    }
  }

  const handleImportCurriculum = () => {
    const lines = importText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    if (lines.length === 0) {
      toast.error('Bolunecek mufredat satiri yok.')
      return
    }

    const nextResourceStart = Math.max(0, ...resources.map((resource) => resource.id)) + 1
    const createdResources = lines.map<EducationResource>((line, index) => ({
      id: nextResourceStart + index,
      education_id: education.id,
      name: line,
      type: line.toLowerCase().includes('pdf') ? 'PDF' : 'LINK',
      url_or_path: `imported://${line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    }))

    setResources((current) => [...current, ...createdResources])
    setImportText('')
    setIsImporterOpen(false)
    toast.success(`${createdResources.length} konu kaynak listesine eklendi.`)
  }

  const handleCopyPrompt = async (topicName: string) => {
    const prompt = `Su anda ${education.title} kursunda ${topicName} konusunu calisiyorum. Bana bu konuyla ilgili Intellij IDE'sinde yazabilecegim, kolaydan zora dogru siralanmis 5 adet pratik kodlama egzersizi hazirlar misin?`

    try {
      await navigator.clipboard.writeText(prompt)
      toast.success('AI pratik promptu panoya kopyalandi.')
    } catch {
      toast.error('Pano erisimi basarisiz oldu.')
    }
  }

  const handleAddFile = async () => {
    if (!selectedPractice) {
      return
    }

    const requestedName = window.prompt('Yeni dosya adi', 'UserService.java')?.trim()
    if (!requestedName) {
      toast.info('Dosya ekleme iptal edildi.')
      return
    }

    const normalizedName = requestedName.includes('.') ? requestedName : `${requestedName}.java`
    if (codeFiles.some((file) => file.name === normalizedName)) {
      toast.error('Bu isimde bir dosya zaten var.')
      return
    }

    const nextFiles = [...codeFiles, { name: normalizedName, content: '' }]
    setActiveFileName(normalizedName)
    await handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(nextFiles) })
  }

  const handleCodeChange = async (content: string) => {
    if (!selectedPractice || !activeFile) {
      return
    }

    const nextFiles = codeFiles.map((file) => (file.name === activeFile.name ? { ...file, content } : file))
    await handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(nextFiles) })
  }

  const handleNotesChange = async (notes: string) => {
    if (!selectedPractice) {
      return
    }

    await handleUpdatePractice(selectedPractice.id, { notes })
  }

  const handleCreateStudyTask = async () => {
    const title = window.prompt('Calisma gorevi adi', selectedPractice ? `${selectedPractice.title} calis` : 'Egitim calismasi')?.trim()
    if (!title) {
      toast.info('Gorev ekleme iptal edildi.')
      return
    }

    try {
      await createTaskMutation.mutateAsync({
        title,
        notes: selectedPractice ? `${education.title} / ${selectedPractice.title}` : education.title,
        status: 'TODO',
        kind: 'EDUCATION',
        planningBucket: 'UNSCHEDULED',
        educationId: education.id,
      })
      toast.success('Calisma gorevi eklendi.')
    } catch {
      toast.error('Calisma gorevi eklenemedi.')
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[35fr_65fr]">
      <section className="rounded-lg border border-slate-200 bg-white/70 p-4 text-slate-950 shadow-md backdrop-blur-2xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-slate-950 dark:text-slate-100">Akilli Mufredat</h2>
            <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">{resources.length} kaynak, {practices.length} pratik</p>
          </div>
          <button
            type="button"
            onClick={() => setIsImporterOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-700 shadow-[0_0_16px_rgba(6,182,212,0.12)] transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
          >
            <UploadCloud className="h-4 w-4" />
            Mufredat Yapistir
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {linkedPractices.map(({ resource, practices: resourcePractices }) => (
            <div key={resource.id} className="rounded-lg border border-slate-200 bg-white/65 p-3 shadow-sm dark:border-zinc-800 dark:bg-black/20">
              <div className="flex items-start gap-2">
                <ResourceIcon type={resource.type} />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => resourcePractices[0] && setSelectedPracticeId(resourcePractices[0].id)}>
                  <span className="block truncate text-sm font-bold text-slate-950 dark:text-slate-100">{resource.name}</span>
                  <span className="mt-1 block truncate text-xs font-medium text-slate-700 dark:text-slate-400">{resource.url_or_path}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyPrompt(resource.name)}
                  className="grid h-8 w-8 shrink-0 place-content-center rounded-md border border-cyan-500/20 bg-cyan-500/10 text-cyan-700 transition-all hover:shadow-[0_0_16px_rgba(6,182,212,0.18)] dark:text-cyan-200"
                  aria-label={`${resource.name} icin AI prompt kopyala`}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-1 border-l border-slate-200 pl-3 dark:border-zinc-800">
                {resourcePractices.length === 0 ? (
                  <p className="py-2 text-xs font-medium text-slate-600 dark:text-slate-400">Bu kaynaga bagli pratik yok.</p>
                ) : (
                  resourcePractices.map((practice) => (
                    <button
                      key={practice.id}
                      type="button"
                      onClick={() => {
                        setSelectedPracticeId(practice.id)
                        setActiveFileName('')
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-bold transition-all',
                        selectedPractice?.id === practice.id
                          ? 'bg-cyan-500/10 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.12)] dark:text-cyan-200'
                          : 'text-slate-800 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                      )}
                    >
                      <span className="truncate">{practice.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-slate-200 bg-white/65 p-3 shadow-sm dark:border-zinc-800 dark:bg-black/20">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-cyan-700 dark:text-cyan-300" />
              <h3 className="text-sm font-black text-slate-950 dark:text-slate-100">Genel Alistirmalar & Notlar</h3>
            </div>
            <div className="mt-3 space-y-1 border-l border-slate-200 pl-3 dark:border-zinc-800">
              {generalPractices.map((practice) => (
                <button
                  key={practice.id}
                  type="button"
                  onClick={() => {
                    setSelectedPracticeId(practice.id)
                    setActiveFileName('')
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-bold transition-all',
                    selectedPractice?.id === practice.id
                      ? 'bg-cyan-500/10 text-cyan-800 shadow-[0_0_16px_rgba(6,182,212,0.12)] dark:text-cyan-200'
                      : 'text-slate-800 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                  )}
                >
                  <span className="truncate">{practice.title}</span>
                  {practice.completed && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[720px] flex-col gap-5">
        {selectedPractice ? (
          <>
            <div className="flex min-h-[410px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/70 text-slate-950 shadow-md backdrop-blur-2xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-400">Multi-file IDE</p>
                  <h2 className="truncate text-base font-black text-slate-950 dark:text-slate-100">{selectedPractice.title}</h2>
                </div>
                <button
                  type="button"
                  onClick={handlePersistPractice}
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-700 transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
                >
                  <Save className="h-4 w-4" />
                  Kaydet
                </button>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white/55 px-3 pt-2 dark:border-zinc-800 dark:bg-black/20">
                {codeFiles.map((file) => (
                  <button
                    key={file.name}
                    type="button"
                    onClick={() => setActiveFileName(file.name)}
                    className={cn(
                      'relative rounded-t-md px-3 py-2 font-mono text-xs font-bold transition-all',
                      activeFile.name === file.name
                        ? 'bg-slate-950 text-cyan-100 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-cyan-400 dark:bg-black'
                        : 'text-slate-700 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
                    )}
                  >
                    {file.name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleAddFile}
                  className="mb-1 ml-auto grid h-8 w-8 shrink-0 place-content-center rounded-md border border-slate-200 bg-white/70 text-slate-800 transition-all hover:border-cyan-500/40 hover:text-cyan-700 dark:border-zinc-800 dark:bg-white/[0.05] dark:text-slate-200"
                  aria-label="Yeni kod dosyasi ekle"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="grid flex-1 grid-cols-[3.5rem_1fr] bg-slate-950/80 dark:bg-black/70">
                <div className="select-none border-r border-white/10 px-2 py-4 text-right font-mono text-xs leading-5 text-slate-500">
                  {buildLineNumbers(activeFile.content).map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
                <textarea
                  value={activeFile.content}
                  onChange={(event) => {
                    void handleCodeChange(event.target.value)
                  }}
                  spellCheck={false}
                  className="min-h-[320px] resize-none bg-transparent p-4 font-mono text-xs leading-5 text-cyan-50 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex min-h-[260px] flex-col rounded-lg border border-slate-200 bg-white/70 text-slate-950 shadow-md backdrop-blur-2xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-zinc-800">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-700 dark:text-slate-400">Markdown Ders Notlari</p>
                  <h2 className="text-base font-black text-slate-950 dark:text-slate-100">Pratik hafizasi</h2>
                </div>
                <button
                  type="button"
                  onClick={handleCreateStudyTask}
                  disabled={createTaskMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-700 transition-all hover:bg-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:text-cyan-200"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Calisma Gorevi Ekle
                </button>
              </div>
              <textarea
                value={selectedPractice.notes}
                onChange={(event) => {
                  void handleNotesChange(event.target.value)
                }}
                placeholder="Markdown notlarini buraya yaz..."
                className="min-h-[190px] flex-1 resize-none bg-transparent p-4 text-sm font-medium leading-6 text-slate-950 placeholder:text-slate-500 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          </>
        ) : (
          <div className="grid min-h-[520px] place-content-center rounded-lg border border-slate-200 bg-white/70 p-8 text-center text-slate-950 shadow-md backdrop-blur-2xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
            <Braces className="mx-auto h-10 w-10 text-cyan-700 dark:text-cyan-300" />
            <h2 className="mt-4 text-xl font-black">Kod pratigi secilmedi</h2>
            <p className="mt-2 max-w-sm text-sm font-medium text-slate-700 dark:text-slate-300">Sol panelden bir pratik odasi secerek multi-file IDE alanini ac.</p>
          </div>
        )}
      </section>

      <AnimatePresence>
        {isImporterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] grid place-content-center bg-black/45 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
              className="w-[min(720px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white/85 p-5 text-slate-950 shadow-2xl backdrop-blur-2xl dark:border-zinc-800 dark:bg-zinc-950/85 dark:text-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Mufredat Yapistir</h2>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Her satir bir kaynak olarak simule edilir.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImporterOpen(false)}
                  className="grid h-9 w-9 place-content-center rounded-md border border-slate-200 bg-white/70 text-slate-800 dark:border-zinc-800 dark:bg-white/[0.05] dark:text-slate-200"
                  aria-label="Mufredat modalini kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                placeholder="Java records\nSpring validation\nJPA relationships\n..."
                className="mt-4 min-h-[260px] w-full resize-none rounded-lg border border-slate-200 bg-white/70 p-4 font-mono text-sm text-slate-950 shadow-inner placeholder:text-slate-500 dark:border-zinc-800 dark:bg-black/40 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleImportCurriculum}
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Mufredati Bol
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LanguageStudioProps {
  education: Education
  initialResources: EducationResource[]
  initialPractices: EducationPractice[]
}

const LanguageStudio: React.FC<LanguageStudioProps> = ({ education, initialResources, initialPractices }) => {
  const createTaskMutation = useCreateTask()
  const [activeLevel, setActiveLevel] = React.useState<LanguageLevel>('A1_A2')
  const [practices, setPractices] = React.useState<EducationPractice[]>(initialPractices)
  const [activePracticeId, setActivePracticeId] = React.useState<number | null>(initialPractices[0]?.id ?? null)
  const [word, setWord] = React.useState('')
  const [meaning, setMeaning] = React.useState('')
  const [wordType, setWordType] = React.useState<VocabularyType>('Noun')
  const [diaryText, setDiaryText] = React.useState('')
  const [isTranslateOpen, setIsTranslateOpen] = React.useState(false)
  const [translateInput, setTranslateInput] = React.useState('')
  const [translateResult, setTranslateResult] = React.useState('')
  const [saveState, setSaveState] = React.useState<'idle' | 'saving' | 'saved'>('idle')
  const [flippedCards, setFlippedCards] = React.useState<Record<number, boolean>>({})

  const levelResources = React.useMemo(
    () => initialResources.filter((resource) => (resource.level ?? 'A1_A2') === activeLevel),
    [activeLevel, initialResources]
  )
  const levelPractices = React.useMemo(
    () => practices.filter((practice) => getPracticeLevel(practice) === activeLevel),
    [activeLevel, practices]
  )
  const activePractice = React.useMemo(() => {
    return levelPractices.find((practice) => practice.id === activePracticeId) ?? levelPractices[0] ?? practices[0]
  }, [activePracticeId, levelPractices, practices])
  const vocabulary = React.useMemo(
    () => (activePractice ? parseVocabulary(activePractice.code) : []),
    [activePractice]
  )
  const dueVocabulary = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return vocabulary.filter((card) => card.nextReview <= today || card.box === 1)
  }, [vocabulary])

  React.useEffect(() => {
    const nextPractice = levelPractices[0]
    setActivePracticeId(nextPractice?.id ?? null)
    setFlippedCards({})
  }, [activeLevel, levelPractices])

  React.useEffect(() => {
    setDiaryText(activePractice?.notes ?? '')
  }, [activePractice?.id, activePractice?.notes])

  const handleUpdatePractice = React.useCallback(
    async (practiceId: number, updatedData: PracticeUpdateInput) => {
      const currentPractice = practices.find((practice) => practice.id === practiceId)
      if (!currentPractice) {
        toast.error('Dil pratigi bulunamadi.')
        return null
      }

      const payload = createPracticePayload(currentPractice, updatedData)
      setSaveState('saving')
      setPractices((current) =>
        current.map((practice) =>
          practice.id === practiceId
            ? {
                ...practice,
                title: payload.title,
                completed: payload.completed,
                code: payload.code,
                notes: payload.notes,
                resource_id: payload.resourceId,
              }
            : practice
        )
      )

      try {
        await apiClient.patch(`/educations/practices/${practiceId}`, {
          title: payload.title,
          completed: payload.completed,
          code: payload.code,
          notes: payload.notes,
          resourceId: payload.resourceId,
          orderIndex: payload.orderIndex,
        })
        setSaveState('saved')
      } catch {
        setSaveState('saved')
      }

      return payload
    },
    [practices]
  )

  React.useEffect(() => {
    if (!activePractice || diaryText === activePractice.notes) {
      return
    }

    setSaveState('idle')
    const timeout = window.setTimeout(() => {
      void handleUpdatePractice(activePractice.id, { notes: diaryText })
    }, 1200)

    return () => window.clearTimeout(timeout)
  }, [activePractice, diaryText, handleUpdatePractice])

  const handleAddVocabulary = async () => {
    if (!activePractice) {
      toast.error('Kelime eklemek icin seviye pratigi bulunamadi.')
      return
    }

    const normalizedWord = word.trim()
    const normalizedMeaning = meaning.trim()
    if (!normalizedWord || !normalizedMeaning) {
      toast.error('Kelime ve karsilik alanlari zorunlu.')
      return
    }

    const nextCard: VocabularyCard = {
      id: Math.max(0, ...vocabulary.map((card) => card.id)) + 1,
      word: normalizedWord,
      meaning: normalizedMeaning,
      type: wordType,
      box: 1,
      nextReview: getNextReviewDate(1),
    }
    const nextVocabulary = [...vocabulary, nextCard]
    await handleUpdatePractice(activePractice.id, { code: serializeVocabulary(nextVocabulary) })
    setWord('')
    setMeaning('')
    setWordType('Noun')
    toast.success('Kelime Leitner kutusuna eklendi.')
  }

  const handleLeitnerAction = async (cardId: number, action: 'known' | 'forgot') => {
    if (!activePractice) {
      return
    }

    const nextVocabulary = vocabulary.map((card) => {
      if (card.id !== cardId) {
        return card
      }

      const nextBox = action === 'known' ? (Math.min(3, card.box + 1) as VocabularyCard['box']) : 1
      return {
        ...card,
        box: nextBox,
        nextReview: getNextReviewDate(nextBox),
      }
    })

    await handleUpdatePractice(activePractice.id, { code: serializeVocabulary(nextVocabulary) })
    toast.success(action === 'known' ? 'Kelime bir sonraki kutuya tasindi.' : 'Kelime Kutu 1 tekrarina alindi.')
  }

  const handleTranslate = async () => {
    const query = translateInput.trim()
    if (!query) {
      toast.error('Cevrilecek metin gir.')
      return
    }

    const requestPayload = {
      source: 'en',
      target: 'tr',
      text: query,
    }
    setTranslateResult(`Google Translate entegrasyon paketi hazir: ${JSON.stringify(requestPayload)}`)
    toast.success('Ceviri koprusu payload hazirladi.')
  }

  const handleCreateVocabularyTask = async () => {
    try {
      await createTaskMutation.mutateAsync({
        title: `${education.title} - bugunun kelime gorevi`,
        notes: `${LANGUAGE_LEVELS.find((level) => level.id === activeLevel)?.label ?? activeLevel} kelime tekrarini tamamla.`,
        status: 'TODO',
        kind: 'EDUCATION',
        planningBucket: 'UNSCHEDULED',
        educationId: education.id,
      })
      toast.success('Bugunun kelime gorevi eklendi.')
    } catch {
      toast.error('Kelime gorevi eklenemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white/70 p-3 text-slate-950 shadow-md backdrop-blur-xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
        <div className="grid gap-2 md:grid-cols-4">
          {LANGUAGE_LEVELS.map((level) => {
            const isActive = activeLevel === level.id
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => setActiveLevel(level.id)}
                className={cn(
                  'rounded-md border px-4 py-3 text-sm font-black transition-all',
                  isActive
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 shadow-[0_0_24px_rgba(6,182,212,0.18)] backdrop-blur-xl dark:text-cyan-200'
                    : 'border-slate-200 bg-white/55 text-slate-800 hover:border-cyan-500/30 hover:text-slate-950 dark:border-zinc-800 dark:bg-black/20 dark:text-slate-300 dark:hover:text-white'
                )}
              >
                {level.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white/70 p-5 text-slate-950 shadow-md backdrop-blur-xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Vocabulary Deck</h2>
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              {dueVocabulary.length} tekrar bekliyor, {vocabulary.length} kelime bu seviyede.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {levelResources.map((resource) => (
              <span
                key={resource.id}
                className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-black/20 dark:text-slate-300"
              >
                {resource.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_10rem_auto]">
          <input
            value={word}
            onChange={(event) => setWord(event.target.value)}
            placeholder="English word"
            className="h-11 rounded-md border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-950 shadow-sm placeholder:text-slate-500 dark:border-zinc-800 dark:bg-black/20 dark:text-slate-100"
          />
          <input
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            placeholder="Turkce karsiligi"
            className="h-11 rounded-md border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-950 shadow-sm placeholder:text-slate-500 dark:border-zinc-800 dark:bg-black/20 dark:text-slate-100"
          />
          <select
            value={wordType}
            onChange={(event) => setWordType(event.target.value as VocabularyType)}
            className="h-11 rounded-md border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-950 shadow-sm dark:border-zinc-800 dark:bg-black/20 dark:text-slate-100"
          >
            {VOCABULARY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddVocabulary}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 text-sm font-black text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
          >
            <Plus className="h-4 w-4" />
            Kelime Ekle
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {vocabulary.map((card) => {
            const isFlipped = !!flippedCards[card.id]
            return (
              <div key={card.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => setFlippedCards((current) => ({ ...current, [card.id]: !current[card.id] }))}
                  className="group h-36 w-full [perspective:900px]"
                  aria-label={`${card.word} kartini cevir`}
                >
                  <div
                    className={cn(
                      'relative h-full rounded-xl transition-transform duration-500 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]',
                      isFlipped && '[transform:rotateY(180deg)]'
                    )}
                  >
                    <div className="absolute inset-0 grid place-content-center rounded-xl border border-slate-200 bg-white/70 p-3 text-center shadow-md backdrop-blur-xl [backface-visibility:hidden] dark:border-zinc-800 dark:bg-white/[0.07]">
                      <span className="text-base font-black text-slate-950 dark:text-slate-100">{card.word}</span>
                      <span className="mt-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-200">
                        Box {card.box} · {card.type}
                      </span>
                    </div>
                    <div className="absolute inset-0 grid place-content-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center shadow-md backdrop-blur-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <span className="text-base font-black text-slate-950 dark:text-slate-100">{card.meaning}</span>
                      <span className="mt-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">Next: {card.nextReview}</span>
                    </div>
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleLeitnerAction(card.id, 'known')}
                    className="rounded-md border border-emerald-500/20 bg-emerald-500/20 px-2 py-1.5 text-xs font-black text-emerald-700 transition-all hover:bg-emerald-500/25 dark:text-emerald-300"
                  >
                    Biliyorum
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLeitnerAction(card.id, 'forgot')}
                    className="rounded-md border border-rose-500/20 bg-rose-500/20 px-2 py-1.5 text-xs font-black text-rose-700 transition-all hover:bg-rose-500/25 dark:text-rose-300"
                  >
                    Unuttum
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white/70 text-slate-950 shadow-md backdrop-blur-xl dark:border-zinc-800 dark:bg-white/[0.06] dark:text-slate-100">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 dark:border-zinc-800 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Today's Dev Journal (English Only)</h2>
            <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Bugun ogrendigin yazilim veya dil konularini Ingilizce olarak ozetle.
            </p>
            <p className="mt-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">
              {saveState === 'saving' ? 'Auto-save calisiyor...' : saveState === 'saved' ? 'Auto-save hazir.' : 'Yazmayi biraktiginda 1200ms sonra kaydedilir.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsTranslateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-700 transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
            >
              <Sparkles className="h-4 w-4" />
              Hizli Ceviri / Sozluk Yardimcisi
            </button>
            <button
              type="button"
              onClick={handleCreateVocabularyTask}
              disabled={createTaskMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-xs font-black text-slate-900 transition-all hover:border-cyan-500/30 hover:text-cyan-700 disabled:opacity-60 dark:border-zinc-800 dark:bg-white/[0.05] dark:text-slate-100 dark:hover:text-cyan-200"
            >
              <CalendarPlus className="h-4 w-4" />
              Bugunun Kelime Gorevini Atla
            </button>
          </div>
        </div>
        <textarea
          value={diaryText}
          onChange={(event) => setDiaryText(event.target.value)}
          placeholder="Today I learned..."
          className="min-h-[260px] w-full resize-none bg-transparent p-5 text-sm font-semibold leading-7 text-slate-950 outline-none transition-all placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/35 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </section>

      <AnimatePresence>
        {isTranslateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-content-center bg-black/45 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 18, scale: 0.98 }}
              className="w-[min(640px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white/85 p-5 text-slate-950 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/85 dark:text-slate-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">Hizli Ceviri / Sozluk Yardimcisi</h2>
                  <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">Google Translate API koprusu icin request hazirlar.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTranslateOpen(false)}
                  className="grid h-9 w-9 place-content-center rounded-md border border-slate-200 bg-white/70 text-slate-800 dark:border-zinc-800 dark:bg-white/[0.05] dark:text-slate-200"
                  aria-label="Ceviri modalini kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={translateInput}
                onChange={(event) => setTranslateInput(event.target.value)}
                placeholder="Check this sentence..."
                className="mt-4 min-h-[140px] w-full resize-none rounded-lg border border-slate-200 bg-white/70 p-4 text-sm font-semibold text-slate-950 shadow-inner placeholder:text-slate-500 dark:border-zinc-800 dark:bg-black/40 dark:text-slate-100"
              />
              {translateResult && (
                <div className="mt-3 rounded-md border border-cyan-500/20 bg-cyan-500/10 p-3 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {translateResult}
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleTranslate}
                  className="inline-flex items-center gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-black text-cyan-700 shadow-[0_0_18px_rgba(6,182,212,0.12)] transition-all hover:bg-cyan-500/15 dark:text-cyan-200"
                >
                  <Sparkles className="h-4 w-4" />
                  Kontrol Et
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const GenericEducationStudio: React.FC<{ education: Education; resources: EducationResource[]; practices: EducationPractice[] }> = ({
  education,
  resources,
  practices,
}) => {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-lg border border-slate-200 bg-white/70 p-5 text-slate-950 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">Kaynaklar</h2>
        <div className="mt-4 space-y-3">
          {resources.map((resource) => (
            <div key={resource.id} className="rounded-md border border-slate-200 bg-white/65 p-3 shadow-sm dark:border-white/10 dark:bg-black/20">
              <div className="flex items-start gap-3">
                <ResourceIcon type={resource.type} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">{resource.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-700 dark:text-slate-400">{resource.url_or_path}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white/70 p-5 text-slate-950 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700 dark:text-slate-300">{education.title} pratikleri</h2>
        <div className="mt-4 space-y-3">
          {practices.map((practice) => (
            <div key={practice.id} className="rounded-lg border border-slate-200 bg-white/65 p-4 shadow-sm dark:border-white/10 dark:bg-black/20">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-100">{practice.title}</h3>
              <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">{practice.notes}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export const EducationStudio: React.FC = () => {
  const navigate = useNavigate()
  const params = useParams<{ id: string }>()
  const educationId = Number(params.id)

  const education = React.useMemo(
    () => mockEducations.find((item) => item.id === educationId),
    [educationId]
  )
  const resources = React.useMemo(
    () => mockEducationResources.filter((resource) => resource.education_id === educationId),
    [educationId]
  )
  const practices = React.useMemo(
    () => mockEducationPractices.filter((practice) => practice.education_id === educationId),
    [educationId]
  )

  if (!education) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white/70 p-8 text-slate-950 shadow-md backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100">
        <h1 className="text-xl font-bold">Egitim bulunamadi</h1>
        <button
          type="button"
          onClick={() => navigate('/education')}
          className="mt-4 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200"
        >
          Havuz sayfasina don
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={education.title}
        subtitle={
          education.type === 'PROGRAMMING'
            ? 'Programming Mode studyosu: kaynak, pratik, multi-file kod ve not alani.'
            : education.type === 'LANGUAGE'
              ? 'Dil ogrenim studyosu: Leitner kelime destesi, seviye filtresi ve Ingilizce odak gunlugu.'
              : 'Secili egitime ait kaynaklar, pratikler ve calisma notlari.'
        }
        action={
          <button
            type="button"
            onClick={() => navigate('/education')}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-md backdrop-blur-xl transition-all hover:border-cyan-500/30 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-100 dark:hover:text-cyan-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Havuz
          </button>
        }
      />

      {education.type === 'PROGRAMMING' ? (
        <ProgrammingStudio education={education} initialResources={resources} initialPractices={practices} />
      ) : education.type === 'LANGUAGE' ? (
        <LanguageStudio education={education} initialResources={resources} initialPractices={practices} />
      ) : (
        <GenericEducationStudio education={education} resources={resources} practices={practices} />
      )}
    </div>
  )
}
