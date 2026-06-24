import { Education, EducationCategoryGroup, EducationPractice, EducationResource, EducationType } from './types'

export const EDUCATION_TYPE_LABELS: Record<EducationType, string> = {
  PROGRAMMING: 'Programming',
  LANGUAGE: 'Language',
  OTHER: 'Other',
}

export const mockEducations: Education[] = [
  {
    id: 1,
    title: 'Java Spring Boot',
    source: 'Udemy - Spring Boot Masterclass',
    description: 'REST API, validation, JPA and modular service boundaries.',
    type: 'PROGRAMMING',
    progress_percent: 42,
    status: 'ACTIVE',
    next_study_date: '2026-06-25',
  },
  {
    id: 2,
    title: 'SQL & PostgreSQL',
    source: 'PostgreSQL Docs',
    description: 'Indexing, query planning and schema evolution notes.',
    type: 'PROGRAMMING',
    progress_percent: 64,
    status: 'ACTIVE',
    next_study_date: '2026-06-27',
  },
  {
    id: 3,
    title: 'TypeScript Patterns',
    source: 'Youtube - Advanced TypeScript',
    description: 'Reusable frontend state and typed component contracts.',
    type: 'PROGRAMMING',
    progress_percent: 28,
    status: 'PAUSED',
    next_study_date: null,
  },
  {
    id: 4,
    title: 'English Speaking',
    source: 'Book - Daily English Practice',
    description: 'Daily speaking drills for technical standups and planning.',
    type: 'LANGUAGE',
    progress_percent: 55,
    status: 'ACTIVE',
    next_study_date: '2026-06-26',
  },
  {
    id: 5,
    title: 'System Design Notes',
    source: 'Book - Designing Data-Intensive Applications',
    description: 'Architecture tradeoffs, reliability and data modeling.',
    type: 'OTHER',
    progress_percent: 18,
    status: 'ACTIVE',
    next_study_date: null,
  },
]

export const mockEducationResources: EducationResource[] = [
  {
    id: 101,
    education_id: 1,
    name: 'Spring Boot Reference PDF',
    type: 'PDF',
    url_or_path: '/files/spring-boot-reference.pdf',
  },
  {
    id: 102,
    education_id: 1,
    name: 'Validation and JPA Guide',
    type: 'LINK',
    url_or_path: 'https://spring.io/guides',
  },
  {
    id: 201,
    education_id: 2,
    name: 'PostgreSQL Query Planning',
    type: 'LINK',
    url_or_path: 'https://www.postgresql.org/docs/',
  },
  {
    id: 401,
    education_id: 4,
    name: 'A1-A2 Daily Conversation Deck',
    type: 'PDF',
    url_or_path: '/files/english-speaking-deck.pdf',
    level: 'A1_A2',
  },
  {
    id: 402,
    education_id: 4,
    name: 'B1 Standup Vocabulary Notes',
    type: 'LINK',
    url_or_path: 'https://compileme.local/english/b1-standup',
    level: 'B1',
  },
  {
    id: 403,
    education_id: 4,
    name: 'B2 Technical Explanation Prompts',
    type: 'LINK',
    url_or_path: 'https://compileme.local/english/b2-technical',
    level: 'B2',
  },
]

export const mockEducationPractices: EducationPractice[] = [
  {
    id: 1001,
    education_id: 1,
    resource_id: 101,
    title: 'CRUD endpoint validation mini task',
    completed: false,
    code: JSON.stringify([
      {
        name: 'Main.java',
        content: 'public class Main {\n    public static void main(String[] args) {\n        CourseRequest request = new CourseRequest("Spring Boot");\n        System.out.println(request.title());\n    }\n}',
      },
      {
        name: 'CourseRequest.java',
        content: 'public record CourseRequest(String title) {\n    public CourseRequest {\n        if (title == null || title.isBlank()) {\n            throw new IllegalArgumentException("title is required");\n        }\n    }\n}',
      },
    ]),
    notes: 'DTO validation, mapper and service boundary notes.',
    order_index: 1,
  },
  {
    id: 1002,
    education_id: 1,
    resource_id: null,
    title: 'Build a small module from scratch',
    completed: true,
    code: JSON.stringify([
      {
        name: 'Main.java',
        content: 'public class Main {\n    public static void main(String[] args) {\n        User user = new User("Gorkem");\n        System.out.println(user.name());\n    }\n}',
      },
      {
        name: 'User.java',
        content: 'public record User(String name) {}',
      },
    ]),
    notes: 'General practice not linked to a resource.',
    order_index: 2,
  },
  {
    id: 2001,
    education_id: 2,
    resource_id: 201,
    title: 'Explain an EXPLAIN ANALYZE plan',
    completed: false,
    code: JSON.stringify([
      {
        name: 'query.sql',
        content: 'EXPLAIN ANALYZE\nSELECT *\nFROM task\nWHERE scheduled_date = current_date;',
      },
    ]),
    notes: 'Focus on index usage and row estimates.',
    order_index: 1,
  },
  {
    id: 4001,
    education_id: 4,
    resource_id: 401,
    title: '[A1_A2] Five-minute standup answer',
    completed: false,
    code: JSON.stringify([
      { id: 1, word: 'task', meaning: 'gorev', type: 'Noun', box: 1, nextReview: '2026-06-25' },
      { id: 2, word: 'practice', meaning: 'pratik yapmak', type: 'Verb', box: 1, nextReview: '2026-06-25' },
      { id: 3, word: 'simple', meaning: 'basit', type: 'Adj', box: 2, nextReview: '2026-06-27' },
    ]),
    notes: 'Today I practiced a short standup answer. I explained what I learned and what I will study next.',
    order_index: 1,
  },
  {
    id: 4002,
    education_id: 4,
    resource_id: 402,
    title: '[B1] Sprint review speaking drill',
    completed: false,
    code: JSON.stringify([
      { id: 4, word: 'deadline', meaning: 'son teslim tarihi', type: 'Noun', box: 1, nextReview: '2026-06-25' },
      { id: 5, word: 'improve', meaning: 'gelistirmek', type: 'Verb', box: 2, nextReview: '2026-06-28' },
      { id: 6, word: 'reliable', meaning: 'guvenilir', type: 'Adj', box: 3, nextReview: '2026-07-01' },
    ]),
    notes: 'Today I described my sprint progress and explained the blockers with clearer sentences.',
    order_index: 2,
  },
  {
    id: 4003,
    education_id: 4,
    resource_id: 403,
    title: '[B2] Explain a technical decision',
    completed: false,
    code: JSON.stringify([
      { id: 7, word: 'tradeoff', meaning: 'odunlesim', type: 'Noun', box: 2, nextReview: '2026-06-29' },
      { id: 8, word: 'justify', meaning: 'gerekcelendirmek', type: 'Verb', box: 1, nextReview: '2026-06-25' },
      { id: 9, word: 'maintainable', meaning: 'bakimi kolay', type: 'Adj', box: 2, nextReview: '2026-06-30' },
    ]),
    notes: 'Today I practiced explaining why I selected a modular frontend structure.',
    order_index: 3,
  },
]

export const groupEducationsByType = (educations: Education[]): EducationCategoryGroup[] => {
  const grouped = educations.reduce<Record<EducationType, Education[]>>(
    (acc, education) => {
      acc[education.type].push(education)
      return acc
    },
    {
      PROGRAMMING: [],
      LANGUAGE: [],
      OTHER: [],
    }
  )

  return (Object.keys(grouped) as EducationType[])
    .filter((type) => grouped[type].length > 0)
    .map((type) => ({
      type,
      label: EDUCATION_TYPE_LABELS[type],
      educations: grouped[type],
    }))
}
