import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import {
  LayoutDashboard,
  Folder,
  GraduationCap,
  Lightbulb,
  Calendar,
  Timer,
  Settings,
  UserCircle,
  LogOut,
  ChevronsUpDown,
  UserCog,
  Blocks,
  Plus,
  Sun,
  Moon
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Separator } from '@/components/ui/Separator'

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "3.2rem",
  },
}

const contentVariants = {
  open: { display: "block", opacity: 1 },
  closed: { display: "block", opacity: 1 },
}

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -10,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
}

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1,
}

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
}

export const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const location = useLocation()
  const pathname = location.pathname
  const { theme, toggleTheme } = useUiStore()

  const navItems = [
    { to: '/', label: 'Anasayfa', icon: LayoutDashboard },
    { to: '/projects', label: 'Projeler', icon: Folder },
    { to: '/education', label: 'Eğitimler', icon: GraduationCap },
    { to: '/ideas', label: 'Fikir Havuzu', icon: Lightbulb },
    { to: '/calendar', label: 'Takvim', icon: Calendar },
    { to: '/focus', label: 'Odak Modu', icon: Timer },
  ]

  return (
    <motion.div
      className={cn(
        "sidebar fixed left-0 top-0 z-40 h-full shrink-0 border-r border-border bg-card shadow-lg select-none",
      )}
      initial={isCollapsed ? "closed" : "open"}
      animate={isCollapsed ? "closed" : "open"}
      variants={sidebarVariants}
      transition={transitionProps}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div
        className="relative z-40 flex text-muted-foreground h-full shrink-0 flex-col transition-all"
        variants={contentVariants}
      >
        <motion.ul variants={staggerVariants} className="flex h-full flex-col p-0 m-0 list-none">
          <div className="flex grow flex-col items-center">
            
            {/* Top Logo / Workspace Area */}
            <div className="flex h-[54px] w-full shrink-0 border-b border-border p-2">
              <div className="flex w-full items-center">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
                    <button className="flex w-full items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/40 text-left transition-colors cursor-pointer">
                      <Avatar className="rounded size-5 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xs">
                        <AvatarFallback className="bg-transparent text-primary">C</AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <motion.div
                          variants={variants}
                          className="flex items-center justify-between w-full min-w-0"
                        >
                          <span className="text-sm font-bold text-foreground truncate mr-1">
                            Compileme
                          </span>
                          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </motion.div>
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-card border border-border">
                    <DropdownMenuItem className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" /> Yönetici Paneli
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Blocks className="h-4 w-4" /> Eklentiler
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Yeni Alan Oluştur
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {navItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to))
                      
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                            isActive && "bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-[0_0_15px_rgba(0,255,255,0.05)]",
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                          {!isCollapsed && (
                            <motion.span
                              variants={variants}
                              className="ml-3.5 text-sm truncate"
                            >
                              {item.label}
                            </motion.span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Bottom Footer - Settings & Account */}
              <div className="flex flex-col p-2 gap-1 border-t border-border bg-muted/10">
                <button
                  onClick={toggleTheme}
                  className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 transition-all text-muted-foreground hover:text-foreground hover:bg-secondary/40 text-left cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 shrink-0 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  {!isCollapsed && (
                    <motion.span variants={variants} className="ml-3.5 text-sm">
                      {theme === 'dark' ? 'Açık Tema' : 'Karanlık Tema'}
                    </motion.span>
                  )}
                </button>

                <Link
                  to="/settings"
                  className="flex h-9 w-full flex-row items-center rounded-md px-2 py-1.5 transition-all text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="ml-3.5 text-sm">
                      Ayarlar
                    </motion.span>
                  )}
                </Link>
                
                <div>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger className="w-full focus:outline-none" asChild>
                      <button className="flex h-9 w-full flex-row items-center gap-2 rounded-md px-2 py-1.5 transition-all hover:bg-secondary/40 text-muted-foreground hover:text-foreground text-left cursor-pointer">
                        <Avatar className="size-5 bg-secondary border border-border">
                          <AvatarFallback className="text-[10px] font-bold text-muted-foreground bg-transparent">G</AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                          <motion.div
                            variants={variants}
                            className="flex w-full items-center justify-between min-w-0"
                          >
                            <span className="text-sm font-medium truncate mr-1">Görkem</span>
                            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          </motion.div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" sideOffset={10} className="w-56 bg-card border border-border">
                      <div className="flex flex-row items-center gap-2.5 p-2.5">
                        <Avatar className="size-8 bg-secondary border border-border">
                          <AvatarFallback className="text-xs font-bold text-muted-foreground">G</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="text-sm font-semibold text-foreground truncate">
                            Görkem Esen
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            gorkem@compileme.com
                          </span>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" /> Profilim
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 text-destructive hover:text-destructive">
                        <LogOut className="h-4 w-4" /> Çıkış Yap
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>

          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  )
}
export default Sidebar
