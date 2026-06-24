import { Plus, Loader2 } from 'lucide-react'

// Admin-only pills for the category currently displayed (Script/Storyboard/
// Vidéo) — same toggle-btn pattern as the Script/Storyboard/Vidéo and
// 16:9/9:16/1:1 groups already in the project header, so no new visual
// language is introduced.
export default function VersionSelector({ versions, activeVersionId, onSelect, onCreate, creating }) {
  return (
    <div className="card" style={{ display: 'flex', padding: 4, gap: 4 }}>
      {versions.map((v) => (
        <button
          key={v.id}
          type="button"
          className={`toggle-btn sm${v.id === activeVersionId ? ' active' : ''}`}
          onClick={() => onSelect(v)}
          title={`Version ${v.versionNumber}`}
        >
          V{v.versionNumber}
        </button>
      ))}
      <button
        type="button"
        className="toggle-btn sm"
        onClick={onCreate}
        disabled={creating}
        title="Créer une nouvelle version à partir de la version active"
      >
        {creating ? <Loader2 size={13} className="icon-spin" /> : <Plus size={13} />}
      </button>
    </div>
  )
}
