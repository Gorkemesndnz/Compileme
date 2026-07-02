import React from 'react'
import { toast } from 'sonner'
import {
  VocabularyCard,
  VocabularyType,
  LanguageLevel,
  CheatsheetItem,
  EducationPractice,
} from '../../types'
import {
  parseVocabulary,
  serializeVocabulary,
  parseCheatsheet,
  serializeCheatsheet,
} from '../../components/studioHelpers'

interface UseStudioLanguageProps {
  selectedPractice: EducationPractice | undefined
  handleUpdatePractice: (practiceId: number, fields: Partial<EducationPractice>) => Promise<void>
}

export const useStudioLanguage = ({
  selectedPractice,
  handleUpdatePractice,
}: UseStudioLanguageProps) => {
  const [activeLevel, setActiveLevel] = React.useState<LanguageLevel>('A1_A2')
  const [word, setWord] = React.useState('')
  const [meaning, setMeaning] = React.useState('')
  const [wordType, setWordType] = React.useState<VocabularyType>('Noun')
  const [isTranslateOpen, setIsTranslateOpen] = React.useState(false)
  const [translateInput, setTranslateInput] = React.useState('')
  const [translateResult, setTranslateResult] = React.useState('')
  const [flippedCards, setFlippedCards] = React.useState<Record<number, boolean>>({})

  // Cheatsheet States
  const [keyConcept, setKeyConcept] = React.useState('')
  const [conceptDescription, setConceptDescription] = React.useState('')

  const vocabulary = React.useMemo(
    () => parseVocabulary(selectedPractice?.code ?? ''),
    [selectedPractice?.code]
  )

  const cheatsheet = React.useMemo(
    () => parseCheatsheet(selectedPractice?.code ?? ''),
    [selectedPractice?.code]
  )

  const getNextReviewDate = React.useCallback((box: VocabularyCard['box']) => {
    const daysByBox: Record<VocabularyCard['box'], number> = {
      1: 1,
      2: 3,
      3: 7,
    }
    const next = new Date()
    next.setDate(next.getDate() + daysByBox[box])
    return next.toISOString().slice(0, 10)
  }, [])

  const handleAddVocabWord = React.useCallback(() => {
    if (!selectedPractice) return
    const w = word.trim()
    const m = meaning.trim()
    if (!w || !m) {
      toast.error('Kelime ve Türkçe karşılığı doldurulmalıdır.')
      return
    }

    const newCard: VocabularyCard = {
      id: Date.now(),
      word: w,
      meaning: m,
      type: wordType,
      box: 1,
      nextReview: getNextReviewDate(1),
    }

    const updated = [...vocabulary, newCard]
    void handleUpdatePractice(selectedPractice.id, { code: serializeVocabulary(updated) })
    setWord('')
    setMeaning('')
    toast.success('Yeni kelime desteye eklendi.')
  }, [selectedPractice, word, meaning, wordType, vocabulary, getNextReviewDate, handleUpdatePractice])

  const handleLeitnerResult = React.useCallback((vocabId: number, boxUpdate: 'known' | 'forgot') => {
    if (!selectedPractice) return
    const updated = vocabulary.map((v: VocabularyCard) => {
      if (v.id !== vocabId) return v
      const nextBox = boxUpdate === 'known' ? (Math.min(3, v.box + 1) as VocabularyCard['box']) : 1
      return {
        ...v,
        box: nextBox,
        nextReview: getNextReviewDate(nextBox),
      }
    })
    void handleUpdatePractice(selectedPractice.id, { code: serializeVocabulary(updated) })
    toast.success(
      boxUpdate === 'known' ? 'Kelime bir üst kutuya taşındı!' : 'Kelime 1. Kutuya geri döndü.'
    )
  }, [selectedPractice, vocabulary, getNextReviewDate, handleUpdatePractice])

  const handleQuickTranslate = React.useCallback(async () => {
    const text = translateInput.trim()
    if (!text) return
    setTranslateResult('Çeviriliyor...')
    setTimeout(() => {
      setTranslateResult(`İngilizce: "${text}"\nTürkçe: "[Simüle Çeviri] ${text} öğreniminde pratik yapıyorum."`)
    }, 500)
  }, [translateInput])

  const handleAddCheatItem = React.useCallback(() => {
    if (!selectedPractice) return
    const c = keyConcept.trim()
    const d = conceptDescription.trim()
    if (!c || !d) {
      toast.error('Kavram ve açıklama alanları doldurulmalıdır.')
      return
    }

    const newItem: CheatsheetItem = {
      id: Date.now(),
      keyConcept: c,
      description: d,
    }
    const updated = [...cheatsheet, newItem]
    void handleUpdatePractice(selectedPractice.id, { code: serializeCheatsheet(updated) })
    setKeyConcept('')
    setConceptDescription('')
    toast.success('Hap bilgi eklendi.')
  }, [selectedPractice, keyConcept, conceptDescription, cheatsheet, handleUpdatePractice])

  const handleDeleteCheatItem = React.useCallback((itemId: number) => {
    if (!selectedPractice) return
    const updated = cheatsheet.filter((item: CheatsheetItem) => item.id !== itemId)
    void handleUpdatePractice(selectedPractice.id, { code: serializeCheatsheet(updated) })
    toast.success('Hap bilgi silindi.')
  }, [selectedPractice, cheatsheet, handleUpdatePractice])

  return {
    activeLevel,
    setActiveLevel,
    word,
    setWord,
    meaning,
    setMeaning,
    wordType,
    setWordType,
    isTranslateOpen,
    setIsTranslateOpen,
    translateInput,
    setTranslateInput,
    translateResult,
    setTranslateResult,
    flippedCards,
    setFlippedCards,
    keyConcept,
    setKeyConcept,
    conceptDescription,
    setConceptDescription,
    vocabulary,
    cheatsheet,
    handleAddVocabWord,
    handleLeitnerResult,
    handleQuickTranslate,
    handleAddCheatItem,
    handleDeleteCheatItem,
  }
}
