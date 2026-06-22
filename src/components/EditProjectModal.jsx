import { useState } from 'react'
import { STATUSES, TAG_OPTIONS } from '../utils/storage.js'

export default function EditProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project.name)
  const [client, setClient] = useState(project.client)
  const [status, setStatus] = useState(project.status)
  const [tags, setTags] = useState(project.tags)
  const [startDate, setStartDate] = useState(project.startDate || '')
  const [dueDate, setDueDate] = useState(project.dueDate || '')
  const [price, setPrice] = useState(project.price ?? '')
  const [promoCodeName, setPromoCodeName] = useState(project.promoCodeName || '')
  const [promoCodeValue, setPromoCodeValue] = useState(project.promoCodeValue || '')
  const [affiliationCode, setAffiliationCode] = useState(project.affiliationCode || '')

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
        className="card fade-in-up"
        style={{ width: 420, padding: 28 }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 20 }}>Éditer le projet</h3>

        <FieldRow label="Nom du projet">
          <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: 12 }} />
        </FieldRow>
        <FieldRow label="Nom du client">
          <input value={client} onChange={(e) => setClient(e.target.value)} style={{ width: '100%', padding: 12 }} />
        </FieldRow>
        <FieldRow label="Statut">
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: 12 }}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Tags">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TAG_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className="tag"
                style={{
                  cursor: 'pointer',
                  background: tags.includes(t) ? 'var(--accent)' : 'var(--card-alt)',
                  color: tags.includes(t) ? '#fff' : 'var(--text-dim)',
                  borderColor: tags.includes(t) ? 'var(--accent)' : 'var(--border)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="Date de début (privé)">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>
        <FieldRow label="Date de livraison (privé)">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>
        <FieldRow label="Prix (privé)">
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ex: 1500"
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>

        <FieldRow label="Nom du code promo (visible client)">
          <input
            value={promoCodeName}
            onChange={(e) => setPromoCodeName(e.target.value)}
            placeholder="Ex: WELCOME20"
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>
        <FieldRow label="Valeur du code promo (visible client)">
          <input
            value={promoCodeValue}
            onChange={(e) => setPromoCodeValue(e.target.value)}
            placeholder="Ex: -20%"
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>
        <FieldRow label="Code d'affiliation client (visible client)">
          <input
            value={affiliationCode}
            onChange={(e) => setAffiliationCode(e.target.value)}
            placeholder="Ex: AFF-CLIENT-2026"
            style={{ width: '100%', padding: 12 }}
          />
        </FieldRow>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={() =>
              onSave({
                name,
                client,
                status,
                tags,
                startDate: startDate || null,
                dueDate: dueDate || null,
                price: price === '' ? null : Number(price),
                promoCodeName: promoCodeName || null,
                promoCodeValue: promoCodeValue || null,
                affiliationCode: affiliationCode || null,
              })
            }
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
