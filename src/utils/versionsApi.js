import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { uid } from './storage.js'

export const VERSION_CATEGORIES = ['script', 'storyboard', 'video']

function rowToVersionMeta(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    versionNumber: row.version_number,
    isActive: row.is_active,
    createdAt: row.created_at,
  }
}

function rowToVersion(row) {
  return { ...rowToVersionMeta(row), data: row.data, updatedAt: row.updated_at }
}

// Lightweight list for the version pills selector — excludes `data`, which
// holds the full script/storyboard JSON (can carry large image URLs/text),
// same "summary vs full row" split already used for studio_projects.
export async function loadVersionMetas(projectId) {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('studio_versions')
    .select('id, project_id, category, version_number, is_active, created_at')
    .eq('project_id', projectId)
    .order('version_number', { ascending: true })
  if (error) {
    console.error('loadVersionMetas error:', error.message)
    return []
  }
  return data.map(rowToVersionMeta)
}

export async function loadVersion(versionId) {
  if (!isSupabaseConfigured) return null
  const { data, error } = await supabase
    .from('studio_versions')
    .select('*')
    .eq('id', versionId)
    .maybeSingle()
  if (error) {
    console.error('loadVersion error:', error.message)
    return null
  }
  return data ? rowToVersion(data) : null
}

// One active version per category, each with its full `data` — exactly the
// three payloads the project page needs to render Script/Storyboard/Vidéo.
export async function loadActiveVersions(projectId) {
  if (!isSupabaseConfigured) return {}
  const { data, error } = await supabase
    .from('studio_versions')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
  if (error) {
    console.error('loadActiveVersions error:', error.message)
    return {}
  }
  const byCategory = {}
  for (const row of data) byCategory[row.category] = rowToVersion(row)
  return byCategory
}

// Lazy, self-healing migration: the first time a project created before the
// versioning feature shipped is opened, seed a V1 per category from its
// legacy script/storyboard/video_url columns. No manual backfill needed, and
// it's a no-op once a project already has versions.
export async function ensureVersionsSeeded(project) {
  if (!isSupabaseConfigured) return
  const metas = await loadVersionMetas(project.id)
  const existing = new Set(metas.map((m) => m.category))
  const missing = VERSION_CATEGORIES.filter((c) => !existing.has(c))
  if (missing.length === 0) return
  const seedData = {
    script: project.script,
    storyboard: project.storyboard,
    video: { videoUrl: project.videoUrl },
  }
  const rows = missing.map((category) => ({
    id: uid('ver'),
    project_id: project.id,
    category,
    version_number: 1,
    data: seedData[category],
    is_active: true,
  }))
  const { error } = await supabase.from('studio_versions').insert(rows)
  if (error) throw new Error(error.message)
}

// Duplicates `fromData` (deep-cloned, no asset files re-uploaded — image/audio
// URLs are just copied as strings) into a brand new version, activates it,
// and deactivates whatever was active before for this category.
export async function createVersion(projectId, category, fromData) {
  const metas = await loadVersionMetas(projectId)
  const nextNumber = Math.max(0, ...metas.filter((m) => m.category === category).map((m) => m.versionNumber)) + 1

  await supabase
    .from('studio_versions')
    .update({ is_active: false })
    .eq('project_id', projectId)
    .eq('category', category)
    .eq('is_active', true)

  const row = {
    id: uid('ver'),
    project_id: projectId,
    category,
    version_number: nextNumber,
    data: structuredClone(fromData),
    is_active: true,
  }
  const { data, error } = await supabase.from('studio_versions').insert(row).select().single()
  if (error) throw new Error(error.message)
  return rowToVersion(data)
}

export async function setActiveVersion(projectId, category, versionId) {
  const { error: deactivateError } = await supabase
    .from('studio_versions')
    .update({ is_active: false })
    .eq('project_id', projectId)
    .eq('category', category)
    .eq('is_active', true)
  if (deactivateError) throw new Error(deactivateError.message)

  const { error } = await supabase.from('studio_versions').update({ is_active: true }).eq('id', versionId)
  if (error) throw new Error(error.message)
}

export async function updateVersionData(versionId, data) {
  const { error } = await supabase
    .from('studio_versions')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', versionId)
  if (error) throw new Error(error.message)
}
