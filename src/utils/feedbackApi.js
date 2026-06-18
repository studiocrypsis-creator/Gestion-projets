import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { uid } from './storage.js'

function rowToFeedback(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    message: row.message,
    createdAt: row.created_at,
  }
}

export async function loadFeedbackForProject(projectId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('studio_feedback')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('loadFeedbackForProject error:', error.message)
    return []
  }
  return data.map(rowToFeedback)
}

export async function loadFeedbackCounts() {
  if (!isSupabaseConfigured) return {}
  const { data, error } = await supabase.from('studio_feedback').select('project_id')
  if (error) {
    console.error('loadFeedbackCounts error:', error.message)
    return {}
  }
  const counts = {}
  for (const row of data) {
    counts[row.project_id] = (counts[row.project_id] || 0) + 1
  }
  return counts
}

export async function addFeedback(projectId, message) {
  const { error } = await supabase
    .from('studio_feedback')
    .insert({ id: uid('fb'), project_id: projectId, message })
  if (error) throw new Error(error.message)
}
