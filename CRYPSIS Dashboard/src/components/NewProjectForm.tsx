'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createProject } from '@/lib/actions'

export default function NewProjectForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createProject(formData)
        router.push('/')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Field label="Titre du projet" required>
        <input
          name="title"
          required
          placeholder="Ex: Refonte site e-commerce"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </Field>

      <Field label="Description">
        <textarea
          name="description"
          rows={5}
          placeholder="Décris le projet, le contexte, les technologies utilisées..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </Field>

      <Field label="Lien du projet">
        <input
          name="link"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </Field>

      <Field label="URL de l'image">
        <input
          name="image_url"
          type="url"
          placeholder="https://..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-50"
      >
        {isPending ? 'Création...' : 'Créer le projet'}
      </button>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  )
}
