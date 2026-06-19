import { useState } from 'react'
import AutoTextarea from './AutoTextarea.jsx'

export default function CommentBubble({ onSubmit }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!text.trim()) return
    await onSubmit(text.trim())
    setText('')
    setOpen(false)
    setSent(true)
    setTimeout(() => setSent(false), 2000)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        className="btn-icon"
        title="Laisser un commentaire ici"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        style={{ color: open ? 'var(--accent)' : undefined }}
      >
        💬
      </button>
      {sent && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            fontSize: 11,
            color: 'var(--accent)',
            whiteSpace: 'nowrap',
            zIndex: 21,
          }}
        >
          Envoyé ✓
        </div>
      )}
      {open && (
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={submit}
          className="card"
          style={{ position: 'absolute', top: '130%', right: 0, width: 220, padding: 10, zIndex: 20 }}
        >
          <AutoTextarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Votre commentaire..."
            rows={3}
            style={{ width: '100%', padding: 8, marginBottom: 8, fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, fontSize: 12, padding: '6px 0', justifyContent: 'center' }}
            >
              Envoyer
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '6px 10px', justifyContent: 'center' }}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
              }}
            >
              ✕
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
