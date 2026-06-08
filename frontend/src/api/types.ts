export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt?: string
}

export interface ApiError {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
}

export interface User {
  id: number
  displayName: string
  createdAt: string
}

export interface Settings {
  id: number
  userId: number
  waterGoalMl: number
  weatherCity: string
  theme: 'LIGHT' | 'DARK' | 'SYSTEM'
  focusBrightness: number
  focusTemperature: number
}
