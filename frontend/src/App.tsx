import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { AppLayout } from './layout/AppLayout'
import { WelcomeSplash } from './components/WelcomeSplash'
import { LivingVineBackground } from './components/LivingVineBackground'
import { useUiStore, applyTheme } from './store/useUiStore'

// Feature pages
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { EducationHub } from './features/education/EducationHub'
import { EducationStudio } from './features/education/EducationStudio'
import { IdeasPage } from './features/ideas/IdeasPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { FocusPage } from './features/focus/FocusPage'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'Veriler alınamadı.'
      toast.error(`İstek Başarısız: ${message}`, {
        id: `query-error-${message.substring(0, 25)}`
      })
    }
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      const message = error.response?.data?.message || error.message || 'İşlem gerçekleştirilemedi.'
      toast.error(`Hata: ${message}`, {
        id: `mutation-error-${message.substring(0, 25)}`
      })
    }
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // 30 seconds
    },
  },
})

export const App: React.FC = () => {
  const [splashComplete, setSplashComplete] = useState(false)
  const theme = useUiStore((state) => state.theme)

  React.useEffect(() => {
    applyTheme(theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <LivingVineBackground />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectsPage />} />
            <Route path="/projects/:id/phases/:phaseId" element={<ProjectsPage />} />
            <Route path="/education" element={<EducationHub />} />
            <Route path="/education/:id" element={<EducationStudio />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/ideas/:id" element={<IdeasPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/focus" element={<FocusPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      <Toaster richColors position="top-right" theme={theme} closeButton />
      {!splashComplete && <WelcomeSplash onComplete={() => setSplashComplete(true)} />}
    </QueryClientProvider>
  )
}
export default App
