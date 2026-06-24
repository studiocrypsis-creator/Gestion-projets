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
    // Feedback rows created before the versioning feature shipped have no
    // version_number — they were made when each category effectively only
    // had a V1, so null is treated as "version 1" everywhere this is compared.
    versionNumber: row.version_number,
  }
}

export function getFeedbackCategory(f) {
  if (f.targetType === 'script_section') return 'Script'
  if (f.targetType === 'storyboard_plan') return 'Storyboard'
  return 'Vidéo'
}

export const FEEDBACK_CATEGORIES = ['Script', 'Storyboard', 'Vidéo']

// Maps a feedback "category" label to the version-category key used by
// studio_versions/versionsApi.js.
export const FEEDBACK_CATEGORY_TO_VERSION_KEY = {
  Script: 'script',
  Storyboard: 'storyboard',
  Vidéo: 'video',
}

// True when a feedback item belongs to whichever version of its category is
// currently active — used to keep "Retours client" / highlighting scoped to
// the version being viewed instead of leaking across versions.
export function feedbackMatchesActiveVersion(f, activeVersionNumbers) {
  const key = FEEDBACK_CATEGORY_TO_VERSION_KEY[getFeedbackCategory(f)]
  const activeNumber = activeVersionNumbers[key] ?? 1
  const feedbackNumber = f.versionNumber ?? 1
  return feedbackNumber === activeNumber
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

export async function addFeedback(projectId, message, target = null, versionNumber = null) {
  const { error } = await supabase.from('studio_feedback').insert({
    id: uid('fb'),
    project_id: projectId,
    message,
    target_type: target?.type || null,
    target_id: target?.id || null,
    target_label: target?.label || null,
    video_timestamp: target?.timestamp ?? null,
    version_number: versionNumber,
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
