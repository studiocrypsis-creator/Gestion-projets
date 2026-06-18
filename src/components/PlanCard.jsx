import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef } from 'react'
import CommentBubble from './CommentBubble.jsx'

export default function PlanCard({ plan, index, onChange, onRemove, onComment, readOnly = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
  })
  const fileInputRef = useRef(null)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function handleFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange({ ...plan, image: reader.result })
    reader.readAsDataURL(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    handleFile(file)
  }

  return (
    <div ref={setNodeRef} style={style} className="card" >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!readOnly && (
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', color: 'var(--text-faint)', fontSize: 16 }}
              title="Déplacer"
            >
              ⠿
            </span>
          )}
          <span style={{ fontWeight: 700, fontSize: 13 }}>Plan {index + 1}</span>
        </div>
        {readOnly ? (
          onComment && <CommentBubble onSubmit={onComment} />
        ) : (
          <div style={{ display: 'flex', gap: 2 }}>
            <button className="btn-icon" title="Commentaire">
              💬
            </button>
            <button className="btn-icon" title="Supprimer" onClick={onRemove}>
              ✕
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: 12 }}>
        <Label>Voix off</Label>
        <textarea
          value={plan.voiceover}
          onChange={(e) => onChange({ ...plan, voiceover: e.target.value })}
          readOnly={readOnly}
          placeholder="Texte de la voix off..."
          rows={2}
          style={{
            width: '100%',
            padding: 10,
            background: 'var(--card-alt)',
            fontSize: 13,
            marginBottom: 12,
            resize: 'vertical',
          }}
        />

        <div
          onClick={() => !readOnly && fileInputRef.current?.click()}
          onDragOver={(e) => !readOnly && e.preventDefault()}
          onDrop={readOnly ? undefined : handleDrop}
          style={{
            height: 140,
            borderRadius: 8,
            border: '1px dashed var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: readOnly ? 'default' : 'pointer',
            overflow: 'hidden',
            background: plan.image ? 'transparent' : 'var(--bg)',
            marginBottom: 12,
          }}
        >
          {plan.image ? (
            <img src={plan.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--text-faint)', fontSize: 13, textAlign: 'center', padding: 8 }}>
              {readOnly ? 'Pas d\'image' : 'Cliquer ou déposer une image'}
            </span>
          )}
        </div>
        {!readOnly && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        )}

        <Label>Description</Label>
        <textarea
          value={plan.description}
          onChange={(e) => onChange({ ...plan, description: e.target.value })}
          readOnly={readOnly}
          placeholder="Description du plan..."
          rows={2}
          style={{
            width: '100%',
            padding: 10,
            background: 'var(--card-alt)',
            fontSize: 13,
            fontStyle: 'italic',
            resize: 'vertical',
          }}
        />
      </div>
    </div>
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
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  )
}
