import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Folder, 
  GraduationCap, 
  Lightbulb, 
  Calendar, 
  Timer
} from 'lucide-react'

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Anasayfa', icon: LayoutDashboard },
    { to: '/projects', label: 'Projeler', icon: Folder },
    { to: '/education', label: 'Eğitimler', icon: GraduationCap },
    { to: '/ideas', label: 'Fikir Havuzu', icon: Lightbulb },
    { to: '/calendar', label: 'Takvim', icon: Calendar },
    { to: '/focus', label: 'Odak Modu', icon: Timer },
  ]

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col shrink-0">
      {/* Header / Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary text-xl font-black shadow-[0_0_15px_rgba(0,255,255,0.1)]">
          C
        </div>
        <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
          Compileme
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary shadow-[inset_1px_0_0_rgba(0,255,255,0.05)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* User Footer info */}
      <div className="p-4 border-t border-border flex items-center gap-3 bg-muted/20">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground border border-border">
          G
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">Görkem</span>
          <span className="text-[10px] text-muted-foreground">Mühendis</span>
        </div>
      </div>
    </aside>
  )
}
