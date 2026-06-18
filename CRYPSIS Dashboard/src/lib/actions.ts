'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function createProject(formData: FormData) {
  const title = String(formData.get('title') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const link = String(formData.get('link') ?? '').trim()
  const image_url = String(formData.get('image_url') ?? '').trim()

  if (!title) {
    throw new Error('Le titre est requis.')
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase n\'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('projects').insert({
    title,
    description: description || null,
    link: link || null,
    image_url: image_url || null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/')
}

export async function createComment(projectId: string, formData: FormData) {
  const author = String(formData.get('author') ?? '').trim()
  const content = String(formData.get('content') ?? '').trim()

  if (!author || !content) {
    throw new Error('Le nom et le commentaire sont requis.')
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase n\'est pas configuré. Renseigne NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from('comments').insert({
    project_id: projectId,
    author,
    content,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/projects/${projectId}`)
}
