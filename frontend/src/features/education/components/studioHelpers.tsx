import React from 'react'
import {
  Youtube,
  Tv,
  GraduationCap,
  Github,
  MonitorPlay,
  Play,
  Presentation,
  Image,
  Globe,
  FileText,
  Link as LinkIcon
} from 'lucide-react'
import { CodeFile, VocabularyCard, CheatsheetItem, EducationResource, LanguageLevel, ReinforcementTarget } from '../types'

export const defaultCodeFiles: CodeFile[] = [
  {
    name: 'Main.java',
    content: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("CompileMe practice");\n    }\n}',
  },
]

export const parseCodeFiles = (rawCode: string): CodeFile[] => {
  if (!rawCode || !rawCode.trim()) {
    return defaultCodeFiles
  }
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) {
      return parsed as CodeFile[]
    }
  } catch {
    return [{ name: 'Main.java', content: rawCode }]
  }
  return [{ name: 'Main.java', content: rawCode }]
}

export const serializeCodeFiles = (files: CodeFile[]): string => {
  try {
    return JSON.stringify(files)
  } catch {
    return '[]'
  }
}

export const parseVocabulary = (rawCode: string): VocabularyCard[] => {
  if (!rawCode || !rawCode.trim()) return []
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) return parsed as VocabularyCard[]
  } catch {
    return []
  }
  return []
}

export const serializeVocabulary = (cards: VocabularyCard[]): string => {
  try {
    return JSON.stringify(cards)
  } catch {
    return '[]'
  }
}

export const parseCheatsheet = (rawCode: string): CheatsheetItem[] => {
  if (!rawCode || !rawCode.trim()) return []
  try {
    const parsed = JSON.parse(rawCode)
    if (Array.isArray(parsed)) return parsed as CheatsheetItem[]
  } catch {
    return []
  }
  return []
}

export const serializeCheatsheet = (items: CheatsheetItem[]): string => {
  try {
    return JSON.stringify(items)
  } catch {
    return '[]'
  }
}

export const getPlatformIcon = (source: string) => {
  const normalized = source.toLowerCase()
  if (normalized.includes('youtube')) return <Youtube className="h-4 w-4 text-red-500" />
  if (normalized.includes('udemy')) return <Tv className="h-4 w-4 text-purple-500" />
  return <GraduationCap className="h-4 w-4 text-cyan-500" />
}

export const getBrandIcon = (url: string) => {
  const lower = url.toLowerCase()
  if (lower.includes('github')) return <Github className="h-5 w-5 text-slate-900 dark:text-white" />
  if (lower.includes('udemy')) return <MonitorPlay className="h-5 w-5 text-purple-500" />
  if (lower.includes('youtube')) return <Youtube className="h-5 w-5 text-red-500" />
  return <Globe className="h-5 w-5 text-cyan-500" />
}

export const getGlowColor = (url: string) => {
  const lower = url.toLowerCase()
  if (lower.includes('github')) return 'hover:shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:border-slate-400'
  if (lower.includes('udemy')) return 'hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:border-purple-500/50'
  if (lower.includes('youtube')) return 'hover:shadow-[0_0_24px_rgba(239,68,68,0.3)] hover:border-red-500/50'
  return 'hover:shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:border-cyan-500/50'
}

export const getFileIcon = (fileName: string, fileType: string) => {
  const name = fileName.toLowerCase()
  if (fileType === 'PDF' || name.endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />
  }
  if (fileType === 'LINK' || name.startsWith('http')) {
    return <LinkIcon className="h-4 w-4 text-sky-500 shrink-0" />
  }
  if (fileType === 'VIDEO' || name.includes('video') || name.includes('youtube')) {
    return <Play className="h-4 w-4 text-purple-500 shrink-0" />
  }
  if (name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.presentation')) {
    return <Presentation className="h-4 w-4 text-orange-500 shrink-0" />
  }
  if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif')) {
    return <Image className="h-4 w-4 text-blue-500 shrink-0" />
  }
  return <FileText className="h-4 w-4 text-cyan-500 shrink-0" />
}

export const buildLineNumbers = (content: string) => {
  const count = Math.max(content.split('\n').length, 14)
  return Array.from({ length: count }, (_, idx) => idx + 1)
}

export const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + days)
  return nextDate.toISOString().slice(0, 10)
}

export const getNextReviewDate = (box: VocabularyCard['box']) => {
  const intervals: Record<VocabularyCard['box'], number> = {
    1: 1,
    2: 3,
    3: 7,
  }
  return addDays(new Date(), intervals[box] || 1)
}

export const getTargetLabel = (target: ReinforcementTarget) => {
  return target.type === 'resource' ? target.resource.name : `${target.projectName} / ${target.document.title}`
}
