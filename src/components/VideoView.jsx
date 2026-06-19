import { useState } from 'react'
import CommentBubble from './CommentBubble.jsx'

function extractYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export default function VideoView({ videoUrl, onChange, onComment, readOnly, highlighted }) {
  const [draftUrl, setDraftUrl] = useState(videoUrl || '')
  const videoId = extractYouTubeId(videoUrl)

  function save(e) {
    e.preventDefault()
    onChange?.(draftUrl.trim() || null)
  }

  return (
    <div style={{ padding: 28, maxWidth: 920, margin: '0 auto' }}>
      {!readOnly && (
        <form onSubmit={save} className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 10 }}>
          <input
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            placeholder="Lien YouTube (ex: https://youtu.be/xxxxxxx)"
            style={{ flex: 1, padding: '10px 12px' }}
          />
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </form>
      )}

      {videoId ? (
        <div>
          <div
            style={{
              position: 'relative',
              paddingTop: '56.25%',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: highlighted ? '0 0 0 1px var(--accent), 0 0 16px 4px var(--accent)' : 'none',
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Vidéo du projet"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
          {onComment && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <CommentBubble
                onSubmit={(message) => onComment({ type: 'video', id: 'video', label: 'Vidéo' }, message)}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: 'var(--text-faint)', padding: 40, textAlign: 'center' }}>
          {readOnly
            ? "La vidéo n'est pas encore disponible."
            : 'Ajoutez un lien YouTube ci-dessus pour afficher la vidéo.'}
        </div>
      )}
    </div>
  )
}
