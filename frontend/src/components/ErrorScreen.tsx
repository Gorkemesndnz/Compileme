import React from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import { Button } from './ui/Button'

interface ErrorScreenProps {
  title?: string
  message?: string
  onRetry?: () => void
  fullScreen?: boolean
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({
  title = "Bir Hata Oluştu",
  message = "Veriler çekilirken beklenmeyen bir hata meydana geldi.",
  onRetry,
  fullScreen = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-6 gap-4 ${fullScreen ? 'min-h-screen w-full bg-background' : 'h-64 w-full'}`}>
      <div className="h-12 w-12 rounded-full bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2 cursor-pointer">
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Yeniden Dene
        </Button>
      )}
    </div>
  )
}
export default ErrorScreen
