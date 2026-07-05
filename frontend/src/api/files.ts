import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'

export interface StoredFileResponse {
  id: number
  originalName: string
  fileSize: number
  contentType?: string
  createdAt: string
  downloadUrl: string
}

export const useUploadFile = () => {
  return useMutation<StoredFileResponse, Error, File | FormData>({
    mutationFn: async (file) => {
      const formData = file instanceof FormData ? file : new FormData()
      if (!(file instanceof FormData)) {
        formData.append('file', file)
      }
      const response = await apiClient.post<StoredFileResponse>('/files', formData)
      return response.data
    },
  })
}
