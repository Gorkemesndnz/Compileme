import { useQuery } from '@tanstack/react-query'
import { apiClient } from './client'

export interface WeatherResponse {
  weather: {
    id: number
    main: string
    description: string
    icon: string
  }[]
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  name: string
}

export const useWeather = (city?: string) => {
  return useQuery<WeatherResponse>({
    queryKey: ['weather', city],
    queryFn: async () => {
      const response = await apiClient.get<WeatherResponse>('/weather', {
        params: { city }
      })
      return response.data
    },
    enabled: !!city,
  })
}
