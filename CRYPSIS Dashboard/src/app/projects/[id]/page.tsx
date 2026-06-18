import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/server'
import type { Comment, Project } from '@/types'
import CommentForm from '@/components/CommentForm'
import CommentList from '@/components/CommentList'

export const dynamic = 'force-dynamic'

async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured) return null
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.from('projects').select('*').eq('id', id).single()
  return data ?? null
}

async function getComments(projectId: string): Promise<Comment[]> {
  if (!isSupabaseConfigured) return []
  const supabase = createServerSupabaseClient()
  const { data } = await supabase
    .from('comments')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Supabase n&apos;est pas encore configuré.
      </div>
    )
  }

  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const comments = await getComments(project.id)

  return (
    <div>
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Retour aux projets
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-video w-full bg-slate-100">
          {project.image_url ? (
            <Image
              src={project.image_url}
              alt={project.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              Pas d&apos;image
            </div>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
          <p className="mt-1 text-xs text-slate-400">
            Publié le {new Date(project.created_at).toLocaleDateString('fr-FR')}
          </p>
          {project.description && (
            <p className="mt-4 whitespace-pre-line text-slate-600">{project.description}</p>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
            >
              Voir le projet ↗
            </a>
          )}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-slate-900">
          Commentaires <span className="text-slate-400">({comments.length})</span>
        </h2>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CommentForm projectId={project.id} />
        </div>
        <div className="mt-6">
          <CommentList comments={comments} />
        </div>
      </section>
    </div>
  )
}
