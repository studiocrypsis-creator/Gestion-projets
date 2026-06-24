import { supabase } from '../lib/supabase.js'
import { uid } from './storage.js'

const BUCKET = 'storyboard-images'
const CLIENT_DOCS_BUCKET = 'client-documents'

export async function uploadPlanImage(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `plans/${uid('img')}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Client-facing project documents (briefs, devis, factures), namespaced per project
// so files from different projects never collide: {projectId}/{slotKey}/{uid}.pdf
export async function uploadClientDocument(projectId, slotKey, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const path = `${projectId}/${slotKey}/${uid('doc')}.${ext}`
  const { error } = await supabase.storage.from(CLIENT_DOCS_BUCKET).upload(path, file, {
    contentType: file.type || 'application/pdf',
  })
  if (error) throw new Error(error.message)
  return {
    name: file.name,
    url: supabase.storage.from(CLIENT_DOCS_BUCKET).getPublicUrl(path).data.publicUrl,
    path,
  }
}

export async function deleteClientDocument(path) {
  if (!path) return
  const { error } = await supabase.storage.from(CLIENT_DOCS_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}

// Script voiceover/reference audio (MP3/WAV), one per project. Reuses the
// client-documents bucket under its own namespace instead of provisioning a
// new bucket — same public-read setup, no extra Supabase config needed.
export async function uploadScriptAudio(projectId, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'
  const path = `${projectId}/script-audio/${uid('audio')}.${ext}`
  const { error } = await supabase.storage.from(CLIENT_DOCS_BUCKET).upload(path, file, {
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)
  return {
    name: file.name,
    url: supabase.storage.from(CLIENT_DOCS_BUCKET).getPublicUrl(path).data.publicUrl,
    path,
  }
}

export async function deleteScriptAudio(path) {
  if (!path) return
  const { error } = await supabase.storage.from(CLIENT_DOCS_BUCKET).remove([path])
  if (error) throw new Error(error.message)
}
