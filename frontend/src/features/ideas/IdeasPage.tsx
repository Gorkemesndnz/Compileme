import React from 'react'
import { useParams } from 'react-router-dom'
import { IdeasHub } from './IdeasHub'
import { IdeaStudio } from './IdeaStudio'

export const IdeasPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>()
  const ideaId = id ? Number(id) : undefined

  if (ideaId && !Number.isNaN(ideaId)) {
    return <IdeaStudio ideaId={ideaId} />
  }

  return <IdeasHub />
}
