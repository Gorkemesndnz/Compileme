import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { GlassFooter } from '../components/GlassFooter'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/lib/utils'

export const AppLayout: React.FC = () => {
  const location = useLocation()
  const isFocusMode = location.pathname === '/focus'
  const sidebarOpen = useUiStore((state) => state.sidebarOpen)

  if (isFocusMode) {
    return (
      <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground w-full relative flex flex-col">
      <Sidebar />
      {/* Sidebar is fixed, so we add 3.2rem left padding to prevent content overlap */}
      <main className="pl-[3.2rem] flex-grow flex flex-col overflow-y-auto relative">
        {/* Overlay for blur effect */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-black/10 backdrop-blur-[12px] brightness-[0.85] transition-all duration-300 ease-in-out pointer-events-auto",
            sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
          )}
        />
        <div
          className={cn(
            "flex-grow px-6 pt-8 pb-32 md:pb-48 w-full min-h-[85vh] transition-all duration-300 ease-in-out",
            sidebarOpen && "pointer-events-none select-none"
          )}
        >
          <Outlet />
        </div>
        <GlassFooter />
      </main>
    </div>
  )
}
