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
  return useMutation<StoredFileResponse, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post<StoredFileResponse>('/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    },
  })
}
