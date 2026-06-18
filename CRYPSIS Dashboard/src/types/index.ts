export interface Project {
  id: string
  title: string
  description: string | null
  image_url: string | null
  link: string | null
  created_at: string
}

export interface Comment {
  id: string
  project_id: string
  content: string
  author: string
  created_at: string
}
