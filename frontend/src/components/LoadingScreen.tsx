import React from 'react'
import { Spinner } from './ui/Spinner'

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Yükleniyor...",
  fullScreen = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${fullScreen ? 'min-h-screen w-full bg-background' : 'h-64 w-full'}`}>
      <div className="relative flex items-center justify-center">
        <Spinner className="h-10 w-10 text-primary animate-spin" />
        <div className="absolute h-10 w-10 rounded-full border border-primary/20 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        {message}
      </p>
    </div>
  )
}
export default LoadingScreen
