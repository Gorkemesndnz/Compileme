import React, { useEffect, useState } from 'react'

interface WelcomeSplashProps {
  onComplete: () => void
}

export const WelcomeSplash: React.FC<WelcomeSplashProps> = ({ onComplete }) => {
  const [visible, setVisible] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersReducedMotion = mediaQuery.matches

    // If session storage has already played, complete immediately
    const hasPlayed = sessionStorage.getItem('welcome-splash-played')
    if (hasPlayed) {
      onComplete()
      setVisible(false)
      return
    }

    // Define animation timings
    const duration = prefersReducedMotion ? 500 : 2500
    const fadeOutDelay = prefersReducedMotion ? 0 : 2000

    const fadeOutTimeout = setTimeout(() => {
      setFadeOut(true)
    }, fadeOutDelay)

    const finishTimeout = setTimeout(() => {
      sessionStorage.setItem('welcome-splash-played', 'true')
      setVisible(false)
      onComplete()
    }, duration)

    return () => {
      clearTimeout(fadeOutTimeout)
      clearTimeout(finishTimeout)
    }
  }, [onComplete])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-4 px-4">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary text-4xl font-black shadow-[0_0_50px_rgba(0,255,255,0.15)] animate-pulse">
          C
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent py-2">
          Compileme
        </h1>
        <p className="text-muted-foreground text-lg font-medium">
          Hoş geldin, Görkem
        </p>
      </div>
    </div>
  )
}
