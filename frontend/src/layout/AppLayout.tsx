import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export const AppLayout: React.FC = () => {
  const location = useLocation()
  const isFocusMode = location.pathname === '/focus'

  if (isFocusMode) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground w-full">
      <Sidebar />
      <main className="flex-grow overflow-y-auto px-6 py-8 md:px-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
