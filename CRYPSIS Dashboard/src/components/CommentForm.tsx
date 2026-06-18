'use client'

import { useRef, useState, useTransition } from 'react'
import { createComment } from '@/lib/actions'

export default function CommentForm({ projectId }: { projectId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createComment(projectId, formData)
        formRef.current?.reset()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      }
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="author"
          placeholder="Votre nom"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <textarea
        name="content"
        placeholder="Écrire un commentaire..."
        required
        rows={3}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {isPending ? 'Envoi...' : 'Publier le commentaire'}
      </button>
    </form>
  )
}
