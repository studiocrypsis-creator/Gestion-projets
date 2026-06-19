import { supabase } from '../lib/supabase.js'
import { uid } from './storage.js'

const BUCKET = 'storyboard-images'

export async function uploadPlanImage(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `plans/${uid('img')}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
