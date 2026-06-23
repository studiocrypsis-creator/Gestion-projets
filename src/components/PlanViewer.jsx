import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function PlanViewer({ plans, index, onClose, onNavigate }) {
  const plan = plans[index]

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && index < plans.length - 1) onNavigate(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [index, plans.length, onClose, onNavigate])

  if (!plan) return null

  // Rendered into document.body instead of in place: the project page header
  // uses position:sticky + backdrop-filter, which some browsers composite
  // into its own layer that paints above other fixed-position content
  // regardless of z-index. A portal sidesteps that entirely — this becomes a
  // sibling of the header in the DOM instead of a deeply nested descendant,
  // so plain z-index ordering is all that's left to resolve, and it wins.
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(10, 10, 20, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card fade-in-up"
        style={{
          maxWidth: 640,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            Plan {index + 1} / {plans.length}
          </span>
          <button className="btn-icon" onClick={onClose} title="Fermer">
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          <Label>Voix off</Label>
          <p style={{ margin: '4px 0 0', fontSize: 14, lineHeight: 1.5 }}>
            {plan.voiceover || <Empty />}
          </p>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '50vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            margin: '16px 0',
          }}
        >
          {plan.image ? (
            <img
              src={plan.image}
              alt=""
              style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: 'var(--text-faint)', fontSize: 13, padding: 64 }}>Pas d'image</span>
          )}

          {index > 0 && (
            <NavArrow side="left" onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }} />
          )}
          {index < plans.length - 1 && (
            <NavArrow side="right" onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }} />
          )}
        </div>

        <div style={{ padding: '0 16px 16px' }}>
          <Label>Description</Label>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {plan.description || <Empty />}
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}

function NavArrow({ side, onClick }) {
  return (
    <button
      onClick={onClick}
      title={side === 'left' ? 'Plan précédent' : 'Plan suivant'}
      style={{
        position: 'absolute',
        [side]: 8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 40,
        height: 40,
        padding: 0,
        borderRadius: '50%',
        background: 'rgba(13, 13, 26, 0.65)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
        {side === 'left' ? (
          <path d="M10 2L4 8L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M6 2L12 8L6 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}

function Label({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-dim)',
      }}
    >
      {children}
    </div>
  )
}

function Empty() {
  return <span style={{ color: 'var(--text-faint)' }}>—</span>
}
