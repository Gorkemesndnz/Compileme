import { Education, EducationCategoryGroup, EducationType } from './types'

export const EDUCATION_TYPE_LABELS: Record<string, string> = {
  PROGRAMMING: 'Programming',
  LANGUAGE: 'Language',
  FRONTEND: 'Frontend',
  MOBILE: 'Mobile',
  OTHER: 'Other',
}

export const groupEducationsByType = (educations: Education[]): EducationCategoryGroup[] => {
  const grouped = educations.reduce<Record<string, Education[]>>(
    (acc, education) => {
      if (!acc[education.type]) {
        acc[education.type] = []
      }
      acc[education.type].push(education)
      return acc
    },
    {}
  )

  return (Object.keys(grouped) as EducationType[])
    .filter((type) => grouped[type].length > 0)
    .map((type) => ({
      type,
      label: EDUCATION_TYPE_LABELS[type] ?? type,
      educations: grouped[type],
    }))
}
