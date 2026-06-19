import { useEffect } from 'react'

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

  return (
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
      {index > 0 && (
        <NavArrow side="left" onClick={(e) => { e.stopPropagation(); onNavigate(index - 1) }} />
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
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

        <div
          style={{
            width: '100%',
            maxHeight: '55vh',
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {plan.image ? (
            <img
              src={plan.image}
              alt=""
              style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: 'var(--text-faint)', fontSize: 13, padding: 60 }}>Pas d'image</span>
          )}
        </div>

        <div style={{ padding: 16 }}>
          <Label>Voix off</Label>
          <p style={{ margin: '4px 0 16px', fontSize: 14, lineHeight: 1.5 }}>
            {plan.voiceover || <Empty />}
          </p>
          <Label>Description</Label>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontStyle: 'italic', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            {plan.description || <Empty />}
          </p>
        </div>
      </div>

      {index < plans.length - 1 && (
        <NavArrow side="right" onClick={(e) => { e.stopPropagation(); onNavigate(index + 1) }} />
      )}
    </div>
  )
}

function NavArrow({ side, onClick }) {
  return (
    <button
      onClick={onClick}
      title={side === 'left' ? 'Plan précédent' : 'Plan suivant'}
      style={{
        position: 'absolute',
        [side]: 16,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--card-alt)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
        fontSize: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {side === 'left' ? '←' : '→'}
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
