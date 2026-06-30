import { create } from 'zustand'

export type ThemeType = 'light' | 'dark' | 'system'
export type LanguageType = 'tr' | 'en' | 'de'

interface UiState {
  sidebarOpen: boolean
  theme: ThemeType
  language: LanguageType
  activeProjectId?: number
  projectOnboardingOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: ThemeType) => void
  setLanguage: (lang: LanguageType) => void
  setActiveProjectId: (projectId?: number) => void
  setProjectOnboardingOpen: (open: boolean) => void
}

const getInitialTheme = (): ThemeType => {
  return (localStorage.getItem('theme') as ThemeType) || 'dark'
}

const getInitialLanguage = (): LanguageType => {
  return (localStorage.getItem('language') as LanguageType) || 'tr'
}

export const applyTheme = (theme: ThemeType) => {
  let isDark = false
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDark = theme === 'dark'
  }

  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  theme: getInitialTheme(),
  language: getInitialLanguage(),
  activeProjectId: undefined,
  projectOnboardingOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  setLanguage: (language) => {
    localStorage.setItem('language', language)
    set({ language })
  },
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
  setProjectOnboardingOpen: (projectOnboardingOpen) => set({ projectOnboardingOpen }),
}))
