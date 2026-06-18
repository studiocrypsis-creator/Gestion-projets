import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { Project } from '@/types'
import ProjectCard from '@/components/ProjectCard'

export const dynamic = 'force-dynamic'

async function getProjects(): Promise<{ projects: Project[]; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { projects: [], error: 'not-configured' }
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return { projects: [], error: error.message }
  }

  return { projects: data ?? [], error: null }
}

export default async function HomePage() {
  const { projects, error } = await getProjects()

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Mes projets</h1>
        <p className="mt-2 text-slate-500">
          Une sélection de mes réalisations en tant que freelance.
        </p>
      </div>

      {error === 'not-configured' && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Supabase n&apos;est pas encore configuré. Renseigne{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> et{' '}
          <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> dans{' '}
          <code className="rounded bg-amber-100 px-1">.env.local</code>.
        </div>
      )}

      {error && error !== 'not-configured' && (
        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Erreur lors du chargement des projets : {error}
        </div>
      )}

      {!error && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
          Aucun projet pour le moment. Clique sur « + Nouveau projet » pour commencer.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  )
}
