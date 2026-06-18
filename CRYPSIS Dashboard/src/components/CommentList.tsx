import type { Comment } from '@/types'

export default function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return <p className="text-sm text-slate-400">Aucun commentaire pour le moment.</p>
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <li key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">{comment.author}</span>
            <span className="text-xs text-slate-400">
              {new Date(comment.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
        </li>
      ))}
    </ul>
  )
}
