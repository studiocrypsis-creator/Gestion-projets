import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function rowToProject(row) {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    slug: row.slug,
    status: row.status,
    tags: row.tags || [],
    archived: row.archived,
    videoFormat: row.video_format,
    activeView: row.active_view,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startDate: row.start_date,
    dueDate: row.due_date,
    price: row.price,
    script: row.script,
    storyboard: row.storyboard,
  }
}

function projectToRow(project) {
  return {
    id: project.id,
    name: project.name,
    client: project.client,
    slug: project.slug,
    status: project.status,
    tags: project.tags,
    archived: project.archived,
    video_format: project.videoFormat,
    active_view: project.activeView,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    start_date: project.startDate || null,
    due_date: project.dueDate || null,
    price: project.price ?? null,
    script: project.script,
    storyboard: project.storyboard,
  }
}

export async function loadProjects() {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('studio_projects')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('loadProjects error:', error.message)
    return []
  }
  return data.map(rowToProject)
}

export async function insertProject(project) {
  const { error } = await supabase.from('studio_projects').insert(projectToRow(project))
  if (error) throw new Error(error.message)
}

export async function updateProjectRow(project) {
  const { error } = await supabase
    .from('studio_projects')
    .update(projectToRow(project))
    .eq('id', project.id)
  if (error) throw new Error(error.message)
}

export async function deleteProjectRow(id) {
  const { error } = await supabase.from('studio_projects').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
