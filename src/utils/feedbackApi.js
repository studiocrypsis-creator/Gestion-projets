import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { uid } from './storage.js'

function rowToFeedback(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    message: row.message,
    createdAt: row.created_at,
    targetType: row.target_type,
    targetId: row.target_id,
    targetLabel: row.target_label,
    completed: Boolean(row.completed),
    videoTimestamp: row.video_timestamp,
  }
}

export function getFeedbackCategory(f) {
  if (f.targetType === 'script_section') return 'Script'
  if (f.targetType === 'storyboard_plan') return 'Storyboard'
  return 'Vidéo'
}

export const FEEDBACK_CATEGORIES = ['Script', 'Storyboard', 'Vidéo']

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

// Per-project, per-category counts of feedback still marked "non complété" —
// used by the Dashboard project cards' "Retours" breakdown.
export async function loadFeedbackCounts() {
  if (!isSupabaseConfigured) return {}
  const { data, error } = await supabase
    .from('studio_feedback')
    .select('project_id, target_type, completed')
    .eq('completed', false)
  if (error) {
    console.error('loadFeedbackCounts error:', error.message)
    return {}
  }
  const counts = {}
  for (const row of data) {
    const category = getFeedbackCategory({ targetType: row.target_type })
    if (!counts[row.project_id]) counts[row.project_id] = { Script: 0, Storyboard: 0, Vidéo: 0 }
    counts[row.project_id][category] += 1
  }
  return counts
}

export async function addFeedback(projectId, message, target = null) {
  const { error } = await supabase.from('studio_feedback').insert({
    id: uid('fb'),
    project_id: projectId,
    message,
    target_type: target?.type || null,
    target_id: target?.id || null,
    target_label: target?.label || null,
    video_timestamp: target?.timestamp ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function setFeedbackCompleted(feedbackId, completed) {
  const { error } = await supabase
    .from('studio_feedback')
    .update({ completed })
    .eq('id', feedbackId)
  if (error) throw new Error(error.message)
}

export async function deleteFeedback(feedbackId) {
  const { error } = await supabase.from('studio_feedback').delete().eq('id', feedbackId)
  if (error) throw new Error(error.message)
}
