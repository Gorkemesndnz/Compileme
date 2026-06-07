import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from './layout/AppLayout'
import { WelcomeSplash } from './components/WelcomeSplash'

// Feature pages
import { DashboardPage } from './features/dashboard/DashboardPage'
import { ProjectsPage } from './features/projects/ProjectsPage'
import { EducationPage } from './features/education/EducationPage'
import { IdeasPage } from './features/ideas/IdeasPage'
import { CalendarPage } from './features/calendar/CalendarPage'
import { FocusPage } from './features/focus/FocusPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export const App: React.FC = () => {
  const [splashComplete, setSplashComplete] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
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
      
      {!splashComplete && <WelcomeSplash onComplete={() => setSplashComplete(true)} />}
    </QueryClientProvider>
  )
}
export default App
