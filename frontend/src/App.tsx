import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast, Toaster } from 'sonner'
import { AppLayout } from './layout/AppLayout'
import { WelcomeSplash } from './components/WelcomeSplash'
import { LivingVineBackground } from './components/LivingVineBackground'

// Feature pages
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { EducationPage } from './features/education/EducationPage'
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

  return (
    <QueryClientProvider client={queryClient}>
      <LivingVineBackground />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/focus" element={<FocusPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      
      <Toaster richColors position="top-right" theme="dark" closeButton />
      {!splashComplete && <WelcomeSplash onComplete={() => setSplashComplete(true)} />}
    </QueryClientProvider>
  )
}
export default App
