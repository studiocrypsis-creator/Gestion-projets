import Link from 'next/link'
import NewProjectForm from '@/components/NewProjectForm'

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Retour aux projets
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Nouveau projet</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ajoute un projet à ton portfolio.
        </p>
        <div className="mt-6">
          <NewProjectForm />
        </div>
      </div>
    </div>
  )
}
