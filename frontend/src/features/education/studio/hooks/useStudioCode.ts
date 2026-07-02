import React from 'react'
import { toast } from 'sonner'
import { CodeFile, EducationPractice } from '../../types'
import { parseCodeFiles, serializeCodeFiles } from '../../components/studioHelpers'

interface UseStudioCodeProps {
  selectedPractice: EducationPractice | undefined
  handleUpdatePractice: (practiceId: number, fields: Partial<EducationPractice>) => Promise<void>
  confirmNavigation: () => boolean
}

export const useStudioCode = ({
  selectedPractice,
  handleUpdatePractice,
  confirmNavigation,
}: UseStudioCodeProps) => {
  const [activeFileName, setActiveFileName] = React.useState('Main.java')
  const [codeDraft, setCodeDraft] = React.useState<string | null>(null)

  const codeFiles = React.useMemo(
    () => parseCodeFiles(selectedPractice?.code ?? ''),
    [selectedPractice?.code]
  )

  const activeFile = React.useMemo(
    () => codeFiles.find((f: CodeFile) => f.name === activeFileName) || codeFiles[0] || { name: 'Main.java', content: '' },
    [codeFiles, activeFileName]
  )

  const isCodeDirty = React.useMemo(
    () => codeDraft !== null && codeDraft !== activeFile.content,
    [codeDraft, activeFile.content]
  )

  const handleFileTabChange = React.useCallback((fileName: string) => {
    if (!confirmNavigation()) return
    setActiveFileName(fileName)
    setCodeDraft(null)
  }, [confirmNavigation])

  const handleCodeChange = React.useCallback((newVal: string) => {
    if (!selectedPractice) return
    const updated = codeFiles.map((f: CodeFile) => (f.name === activeFile.name ? { ...f, content: newVal } : f))
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
  }, [selectedPractice, codeFiles, activeFile.name, handleUpdatePractice])

  const handleAddNewFile = React.useCallback(() => {
    if (!selectedPractice) return
    const name = window.prompt('Dosya ismi girin (Örn: Model.java):', 'Model.java')?.trim()
    if (!name) return

    if (codeFiles.some((f: CodeFile) => f.name === name)) {
      toast.error('Aynı isimde başka bir dosya zaten mevcut.')
      return
    }

    const updated = [...codeFiles, { name, content: '// ' + name + ' dosyası oluşturuldu.' }]
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
    setActiveFileName(name)
    toast.success('Yeni kod dosyası oluşturuldu.')
  }, [selectedPractice, codeFiles, handleUpdatePractice])

  const handleSaveCodeDirectly = React.useCallback(() => {
    if (!selectedPractice) return
    const targetContent = codeDraft ?? activeFile.content
    const updated = codeFiles.map((f: CodeFile) => (f.name === activeFile.name ? { ...f, content: targetContent } : f))
    void handleUpdatePractice(selectedPractice.id, { code: serializeCodeFiles(updated) })
    setCodeDraft(null)
    toast.success('Kod değişiklikleri kaydedildi.')
  }, [selectedPractice, codeDraft, activeFile.content, codeFiles, activeFile.name, handleUpdatePractice])

  return {
    activeFileName,
    setActiveFileName,
    codeDraft,
    setCodeDraft,
    codeFiles,
    activeFile,
    isCodeDirty,
    handleFileTabChange,
    handleCodeChange,
    handleAddNewFile,
    handleSaveCodeDirectly,
  }
}
