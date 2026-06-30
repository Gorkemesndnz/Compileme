import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { useTranslation } from '@/store/translations'

interface GreetingWithWeatherProps {
  temp?: number
  condition?: string
  className?: string
}

export const GreetingWithWeather: React.FC<GreetingWithWeatherProps> = ({
  temp,
  condition = 'Clear',
  className,
}) => {
  const { language } = useTranslation()
  const currentHour = new Date().getHours()
  const isDay = currentHour >= 6 && currentHour < 20

  // Zamana göre karşılama metni
  const getGreetingText = () => {
    if (language === 'en') {
      if (currentHour >= 5 && currentHour < 12) return 'Good Morning'
      if (currentHour >= 12 && currentHour < 18) return 'Good Day'
      if (currentHour >= 18 && currentHour < 22) return 'Good Evening'
      return 'Good Night'
    } else if (language === 'de') {
      if (currentHour >= 5 && currentHour < 12) return 'Guten Morgen'
      if (currentHour >= 12 && currentHour < 18) return 'Guten Tag'
      if (currentHour >= 18 && currentHour < 22) return 'Guten Abend'
      return 'Gute Nacht'
    } else {
      if (currentHour >= 5 && currentHour < 12) return 'Günaydın'
      if (currentHour >= 12 && currentHour < 18) return 'İyi Günler'
      if (currentHour >= 18 && currentHour < 22) return 'İyi Akşamlar'
      return 'İyi Geceler'
    }
  }

  // Tarih formatı
  const locale = language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : 'tr-TR'
  const formattedDate = new Date().toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Sıcaklık formatı
  const displayTemp = temp !== undefined ? `${Math.round(temp)}°C` : '24°C'

  // Hava durumu durumuna göre ikon render etmek
  const renderWeatherIcon = () => {
    const normalizedCond = condition.toLowerCase()

    if (normalizedCond === 'clear') {
      if (isDay) {
        // Clear Gündüz - Güneş (Yavaş Dönen)
        return (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-14 w-14 text-amber-500 dark:text-amber-400"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </motion.svg>
        )
      } else {
        // Clear Gece - Hilal / Ay (Pulse Efektli)
        return (
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-14 w-14 text-blue-400 dark:text-cyan-300"
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.96, 1.04, 0.96] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </motion.svg>
        )
      }
    }

    if (normalizedCond === 'clouds' || normalizedCond === 'mist' || normalizedCond === 'smoke' || normalizedCond === 'haze' || normalizedCond === 'dust' || normalizedCond === 'fog') {
      // Clouds - Bulut (Yüzen Floating)
      return (
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-14 w-14 text-zinc-400 dark:text-zinc-300"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.48 0-.96.06-1.4.17A5.5 5.5 0 0 0 5 12.5C5 16.09 7.91 19 11.5 19H17.5Z" />
        </motion.svg>
      )
    }

    if (normalizedCond === 'rain' || normalizedCond === 'drizzle' || normalizedCond === 'thunderstorm' || normalizedCond === 'snow') {
      // Rain - Yağmurlu Bulut (Yağmur Animasyonlu)
      return (
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-14 w-14 text-blue-500 dark:text-blue-400"
          animate={{ y: [0, -1.5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <path d="M17.5 15A3.5 3.5 0 0 0 21 11.5c0-2.79-2.54-4.5-5-4.5-.48 0-.96.06-1.4.17A5.5 5.5 0 0 0 5 8.5C5 12.09 7.91 15 11.5 15H17.5Z" />
          {/* Droplet 1 */}
          <motion.line
            x1="8"
            y1="16"
            x2="6.5"
            y2="20"
            animate={{ y: [0, 3], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear', delay: 0 }}
          />
          {/* Droplet 2 */}
          <motion.line
            x1="12"
            y1="16"
            x2="10.5"
            y2="20"
            animate={{ y: [0, 3], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear', delay: 0.4 }}
          />
          {/* Droplet 3 */}
          <motion.line
            x1="16"
            y1="16"
            x2="14.5"
            y2="20"
            animate={{ y: [0, 3], opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear', delay: 0.8 }}
          />
        </motion.svg>
      )
    }

    // Default Fallback (Sun or Moon depending on time)
    return isDay ? (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-14 w-14 text-amber-500 dark:text-amber-400"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </motion.svg>
    ) : (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-14 w-14 text-blue-400 dark:text-cyan-300"
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.96, 1.04, 0.96] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </motion.svg>
    )
  }

  return (
    <div className={cn('flex items-center gap-5 py-2 select-none', className)}>
      {/* Left Column: Icon Area & Temp (aligned vertically) */}
      <div className="flex flex-col items-center justify-center shrink-0 min-w-[70px]">
        <div className="flex h-14 w-14 items-center justify-center overflow-visible bg-transparent">
          {renderWeatherIcon()}
        </div>
        <span className="text-[13px] font-bold tracking-tight text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
          {displayTemp}
        </span>
      </div>

      {/* Right Column: Greeting & Date */}
      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white">
          {getGreetingText()}
        </h1>
        {/* Simplified Date */}
        <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-500 dark:text-zinc-400">
          {formattedDate}
        </p>
      </div>
    </div>
  )
}
