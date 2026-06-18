import { uid } from '../utils/storage.js'

export default function ScriptView({ script, onChange }) {
  function updateIntro(id, content) {
    onChange({
      ...script,
      introVariants: script.introVariants.map((s) => (s.id === id ? { ...s, content } : s)),
    })
  }

  function updateTrunk(id, content) {
    onChange({
      ...script,
      commonTrunk: script.commonTrunk.map((s) => (s.id === id ? { ...s, content } : s)),
    })
  }

  function addIntro() {
    const n = script.introVariants.length + 1
    onChange({
      ...script,
      introVariants: [...script.introVariants, { id: uid('hook'), title: `Hook ${n}`, content: '' }],
    })
  }

  function removeIntro(id) {
    if (script.introVariants.length <= 1) return
    onChange({ ...script, introVariants: script.introVariants.filter((s) => s.id !== id) })
  }

  function addTrunkSection() {
    onChange({
      ...script,
      commonTrunk: [
        ...script.commonTrunk,
        { id: uid('sec'), title: 'NOUVELLE SECTION', content: '' },
      ],
    })
  }

  function renameTrunk(id, title) {
    onChange({
      ...script,
      commonTrunk: script.commonTrunk.map((s) => (s.id === id ? { ...s, title } : s)),
    })
  }

  function removeTrunk(id) {
    onChange({ ...script, commonTrunk: script.commonTrunk.filter((s) => s.id !== id) })
  }

  return (
    <div style={{ background: 'var(--bg-header)', minHeight: 'calc(100vh - 65px)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Section title="Variantes d'introduction">
          {script.introVariants.map((sub, i) => (
            <SubSection
              key={sub.id}
              label={sub.title}
              value={sub.content}
              onChange={(v) => updateIntro(sub.id, v)}
              onRemove={script.introVariants.length > 1 ? () => removeIntro(sub.id) : null}
              isLast={i === script.introVariants.length - 1}
            />
          ))}
          <AddButton onClick={addIntro} label="+ Ajouter un hook" />
        </Section>

        <Section title="Tronc commun">
          {script.commonTrunk.map((sub, i) => (
            <SubSection
              key={sub.id}
              label={sub.title}
              editableLabel
              onLabelChange={(v) => renameTrunk(sub.id, v)}
              value={sub.content}
              onChange={(v) => updateTrunk(sub.id, v)}
              onRemove={() => removeTrunk(sub.id)}
              isLast={i === script.commonTrunk.length - 1}
            />
          ))}
          <AddButton onClick={addTrunkSection} label="+ Ajouter une sous-section" />
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: 28, marginBottom: 28 }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>{title}</h2>
      {children}
    </div>
  )
}

function SubSection({ label, value, onChange, onRemove, isLast, editableLabel, onLabelChange }) {
  return (
    <div style={{ paddingBottom: 18, marginBottom: 18, borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        {editableLabel ? (
          <input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: 0,
              width: '60%',
              minWidth: 160,
            }}
          />
        ) : (
          <span
            style={{
              color: 'var(--text-dim)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </span>
        )}
        {onRemove && (
          <button className="btn-icon" onClick={onRemove} title="Supprimer">
            ✕
          </button>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Écrire ici..."
        rows={4}
        style={{
          width: '100%',
          padding: 12,
          resize: 'vertical',
          background: 'var(--card-alt)',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      />
    </div>
  )
}

function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-ghost"
      style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}
    >
      {label}
    </button>
  )
}
