import Image from 'next/image'
import Link from 'next/link'
import type { Project } from '@/types'

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {project.image_url ? (
          <Image
            src={project.image_url}
            alt={project.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
            Pas d&apos;image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand-600">
          {project.title}
        </h2>
        {project.description && (
          <p className="line-clamp-2 text-sm text-slate-500">{project.description}</p>
        )}
        <span className="mt-auto pt-2 text-xs text-slate-400">
          {new Date(project.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>
    </Link>
  )
}
