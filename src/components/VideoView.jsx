import { useEffect, useRef, useState } from 'react'
import AutoTextarea from './AutoTextarea.jsx'

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

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

let ytApiPromise = null
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (ytApiPromise) return ytApiPromise
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve(window.YT)
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(script)
    }
  })
  return ytApiPromise
}

export default function VideoView({
  videoUrl,
  onChange,
  onComment,
  readOnly,
  highlighted,
  feedbackItems = [],
  onToggleCompleted,
  onDeleteFeedback,
}) {
  const [draftUrl, setDraftUrl] = useState(videoUrl || '')
  const [filter, setFilter] = useState('pending')
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentTimestamp, setCommentTimestamp] = useState(0)
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const videoId = extractYouTubeId(videoUrl)

  useEffect(() => {
    if (!videoId || !containerRef.current) return
    let cancelled = false
    loadYouTubeApi().then((YT) => {
      if (cancelled || !containerRef.current) return
      playerRef.current = new YT.Player(containerRef.current, { videoId })
    })
    return () => {
      cancelled = true
      try {
        playerRef.current?.destroy?.()
      } catch {
        // player already torn down
      }
      playerRef.current = null
    }
  }, [videoId])

  function save(e) {
    e.preventDefault()
    onChange?.(draftUrl.trim() || null)
  }

  function openCommentAtCurrentTime() {
    const t = playerRef.current?.getCurrentTime ? Math.round(playerRef.current.getCurrentTime()) : 0
    setCommentTimestamp(t)
    setCommentText('')
    setCommentOpen(true)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    await onComment(
      { type: 'video', id: 'video', label: `Vidéo @ ${formatTime(commentTimestamp)}`, timestamp: commentTimestamp },
      commentText.trim()
    )
    setCommentOpen(false)
    setCommentText('')
  }

  function seekTo(seconds) {
    playerRef.current?.seekTo?.(seconds, true)
  }

  const visibleFeedback = feedbackItems
    .filter((f) => (filter === 'completed' ? f.completed : !f.completed))
    .slice()
    .sort((a, b) => (a.videoTimestamp ?? 0) - (b.videoTimestamp ?? 0))

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
              boxShadow: highlighted ? '0 0 0 1px var(--accent), 0 0 12px 2px var(--accent)' : 'none',
            }}
          >
            <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
          </div>

          {onComment && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={openCommentAtCurrentTime}>
                💬 Commenter à ce moment
              </button>
            </div>
          )}

          {commentOpen && (
            <form onSubmit={submitComment} className="card" style={{ padding: 14, marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 8 }}>
                📌 Vidéo @ {formatTime(commentTimestamp)}
              </div>
              <AutoTextarea
                autoFocus
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Votre retour à cet instant..."
                rows={2}
                style={{ width: '100%', padding: 8, marginBottom: 8, fontSize: 13 }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px' }}>
                  Envoyer
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ fontSize: 12, padding: '6px 14px' }}
                  onClick={() => setCommentOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {(onToggleCompleted || onDeleteFeedback) && (
            <div style={{ marginTop: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-dim)',
                  }}
                >
                  Retours sur la vidéo
                </h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  <FilterButton active={filter === 'pending'} onClick={() => setFilter('pending')}>
                    Non complété
                  </FilterButton>
                  <FilterButton active={filter === 'completed'} onClick={() => setFilter('completed')}>
                    Complété
                  </FilterButton>
                </div>
              </div>

              {visibleFeedback.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                  {filter === 'completed' ? 'Aucun retour complété.' : 'Aucun retour en attente.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleFeedback.map((f) => (
                    <div
                      key={f.id}
                      className="card"
                      style={{ padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}
                    >
                      {!readOnly && (
                        <button
                          type="button"
                          title={f.completed ? 'Marquer comme non complété' : 'Marquer comme complété'}
                          onClick={() => onToggleCompleted?.(f)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: `2px solid ${f.completed ? 'var(--accent)' : 'var(--border)'}`,
                            background: f.completed ? 'var(--accent)' : 'transparent',
                            flexShrink: 0,
                            marginTop: 2,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => seekTo(f.videoTimestamp ?? 0)}
                        className="badge"
                        title="Aller à ce moment de la vidéo"
                        style={{
                          background: 'var(--card-alt)',
                          color: 'var(--accent)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        ⏱ {formatTime(f.videoTimestamp ?? 0)}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            opacity: f.completed ? 0.6 : 1,
                            textDecoration: f.completed ? 'line-through' : 'none',
                          }}
                        >
                          {f.message}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                          {new Date(f.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      {readOnly && !f.completed && (
                        <button
                          type="button"
                          title="Supprimer ce retour"
                          onClick={() => onDeleteFeedback?.(f)}
                          className="btn-icon"
                          style={{ flexShrink: 0, fontSize: 12 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost"
      style={{
        fontSize: 12,
        padding: '6px 12px',
        background: active ? 'var(--accent)' : undefined,
        color: active ? '#06121f' : undefined,
        borderColor: active ? 'var(--accent)' : undefined,
      }}
    >
      {children}
    </button>
  )
}
