import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Folder, 
  GraduationCap, 
  Lightbulb, 
  Calendar, 
  Timer, 
  Github, 
  Terminal, 
  Flame, 
  ArrowUp
} from 'lucide-react'

interface FooterLink {
  title: string
  href: string
  isExternal?: boolean
  icon?: React.ComponentType<{ className?: string }>
}

interface FooterSection {
  label: string
  links: FooterLink[]
}

const footerLinks: FooterSection[] = [
  {
    label: 'Modüller',
    links: [
      { title: 'Dashboard', href: '/', icon: LayoutDashboard },
      { title: 'Projeler', href: '/projects', icon: Folder },
      { title: 'Eğitimler', href: '/education', icon: GraduationCap },
      { title: 'Fikir Havuzu', href: '/ideas', icon: Lightbulb },
    ],
  },
  {
    label: 'Kısayollar',
    links: [
      { title: 'Takvim', href: '/calendar', icon: Calendar },
      { title: 'Odak Modu', href: '/focus', icon: Timer },
    ],
  },
  {
    label: 'Sistem & API',
    links: [
      { title: 'Swagger API', href: 'http://localhost:8080/swagger-ui/index.html', isExternal: true, icon: Terminal },
      { title: 'GitHub', href: 'https://github.com', isExternal: true, icon: Github },
    ],
  },
]

const STYLES = `
@keyframes heartbeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.animate-heartbeat {
  animation: heartbeat 2s ease-in-out infinite;
}
`

export function GlassFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* Footer Wrapper - relative to allow background animations to show through */}
      <footer className="glass-footer relative mx-auto mt-20 w-full max-w-6xl overflow-hidden rounded-t-[2.5rem] border-t px-4 pb-12 md:rounded-t-[3.5rem] md:px-6">
        
        {/* Glow Effects Behind/Inside the Glass */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,rgba(15,23,42,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.16)_1px,transparent_1px)] bg-[size:40px_40px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.16)_1px,transparent_1px)]" />
          
          {/* Radial light coming from top center */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[200px] bg-[radial-gradient(50%_150px_at_50%_0%,rgba(0,230,230,0.12),transparent)]" />
          
        </div>

        {/* Top Glow Border Highlight */}
        <div className="bg-cyan-500/30 absolute top-0 right-1/2 left-1/2 h-[2px] w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[3px] z-10" />

        <div className="relative z-10 pt-12 md:pt-16 pb-8">
          <div className="grid w-full gap-10 xl:grid-cols-3 xl:gap-8">
            
            {/* Left Brand Container */}
            <AnimatedContainer className="space-y-4 flex flex-col items-start">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-600/20 bg-cyan-50/70 backdrop-blur-md dark:border-cyan-500/20 dark:bg-cyan-950/40">
                  <Flame className="h-5 w-5 animate-pulse text-cyan-600 dark:text-cyan-400" />
                  <div className="absolute inset-0 rounded-xl bg-cyan-400/5 blur-[4px]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-neutral-950 dark:text-white">
                  Compile<span className="text-cyan-600 dark:text-cyan-400">me</span>
                </span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Bilgisayar mühendisleri ve geliştiriciler için tasarlanmış kişisel üretkenlik ve planlama merkezi.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-500">
                <span>Derle, Planla, Uygula.</span>
              </div>
            </AnimatedContainer>

            {/* Right Links Container */}
            <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0">
              {footerLinks.map((section, index) => (
                <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
                  <div>
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-800 dark:text-neutral-300">
                      {section.label}
                    </h3>
                    <ul className="space-y-3 text-sm">
                      {section.links.map((link) => (
                        <li key={link.title}>
                          {link.isExternal ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group inline-flex items-center gap-2 text-neutral-600 transition-colors duration-200 hover:text-cyan-700 dark:text-neutral-400 dark:hover:text-cyan-400"
                            >
                              {link.icon && <link.icon className="h-4 w-4 text-neutral-500 transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400" />}
                              <span>{link.title}</span>
                            </a>
                          ) : (
                            <Link
                              to={link.href}
                              className="group inline-flex items-center gap-2 text-neutral-600 transition-colors duration-200 hover:text-cyan-700 dark:text-neutral-400 dark:hover:text-cyan-400"
                            >
                              {link.icon && <link.icon className="h-4 w-4 text-neutral-500 transition-colors group-hover:text-cyan-700 dark:group-hover:text-cyan-400" />}
                              <span>{link.title}</span>
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedContainer>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-8 h-px w-full bg-neutral-900/10 md:my-10 dark:bg-white/5" />

          {/* Bottom Bar */}
          <div className="flex flex-col items-center justify-between gap-6 text-xs text-neutral-600 md:flex-row dark:text-neutral-500">
            <div className="order-2 md:order-1 tracking-wide">
              © {new Date().getFullYear()} Compileme. Tüm hakları saklıdır.
            </div>

            <div className="order-1 flex items-center gap-2 rounded-full border border-neutral-900/10 bg-white/35 px-4 py-2 backdrop-blur-md md:order-2 dark:border-white/5 dark:bg-white/[0.02]">
              <span className="font-medium">Built with</span>
              <span className="text-rose-500 animate-heartbeat">❤</span>
              <span className="font-medium">by</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-300">Görkem</span>
            </div>

            <button
              onClick={scrollToTop}
              className="group order-3 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/10 bg-white/40 text-neutral-700 shadow-lg transition-all duration-300 hover:border-cyan-600/30 hover:bg-cyan-50/80 hover:text-cyan-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-neutral-400 dark:hover:border-cyan-500/30 dark:hover:bg-white/[0.08] dark:hover:text-cyan-400"
              title="Yukarı Git"
            >
              <ArrowUp className="w-4 h-4 transform group-hover:-translate-y-0.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </footer>
    </>
  )
}

type ViewAnimationProps = {
  delay?: number
  className?: string
  children: React.ReactNode
}

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', y: 12, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
