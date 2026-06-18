import { useState } from 'react'
import { STATUSES, TAG_OPTIONS } from '../utils/storage.js'

export default function EditProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project.name)
  const [client, setClient] = useState(project.client)
  const [status, setStatus] = useState(project.status)
  const [tags, setTags] = useState(project.tags)

  function toggleTag(tag) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 420, padding: 28 }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>Éditer le projet</h3>

        <FieldRow label="Nom du projet">
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 10 }} />
        </FieldRow>
        <FieldRow label="Nom du client">
          <input value={client} onChange={(e) => setClient(e.target.value)} style={{ width: '100%', padding: 10 }} />
        </FieldRow>
        <FieldRow label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: 10 }}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Tags">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className="tag"
                style={{
                  cursor: 'pointer',
                  background: tags.includes(t) ? 'var(--accent)' : 'var(--card-alt)',
                  color: tags.includes(t) ? '#06121f' : 'var(--text-dim)',
                  borderColor: tags.includes(t) ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </FieldRow>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({ name, client, status, tags })}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldRow({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}
