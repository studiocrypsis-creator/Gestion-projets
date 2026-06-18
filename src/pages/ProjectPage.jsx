import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { VIDEO_FORMATS } from '../utils/storage.js'
import { loadProjects, updateProjectRow } from '../utils/projectsApi.js'
import ScriptView from '../components/ScriptView.jsx'
import StoryboardView from '../components/StoryboardView.jsx'

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromDashboard = Boolean(location.state?.fromDashboard)
  const [projects, setProjects] = useState([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  const project = projects.find((p) => p.slug === slug)
  const projectIndex = projects.findIndex((p) => p.slug === slug)

  async function updateProject(patch) {
    if (projectIndex === -1) return
    const next = [...projects]
    next[projectIndex] = { ...next[projectIndex], ...patch, updatedAt: new Date().toISOString() }
    setProjects(next)
    try {
      await updateProjectRow(next[projectIndex])
    } catch (err) {
      setError(err.message)
    }
  }

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#/projet/${slug}`
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (!project) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
        Projet introuvable.
        {fromDashboard && (
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>
              ← Retour au tableau de bord
            </button>
          </div>
        )}
      </div>
    )
  }

  const view = project.activeView || 'script'

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 28px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          gap: 16,
        }}
      >
        {fromDashboard ? (
          <button className="btn-icon" onClick={() => navigate('/dashboard')} title="Retour">
            ←
          </button>
        ) : (
          <div style={{ width: 32 }} />
        )}

        <div style={{ fontWeight: 700, fontSize: 16, flex: 1, textAlign: 'center' }}>
          {project.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            className="card"
            style={{
              display: 'flex',
              padding: 4,
              gap: 4,
            }}
          >
            <ToggleButton active={view === 'script'} onClick={() => updateProject({ activeView: 'script' })}>
              Script
            </ToggleButton>
            <ToggleButton
              active={view === 'storyboard'}
              onClick={() => updateProject({ activeView: 'storyboard' })}
            >
              Storyboard
            </ToggleButton>
          </div>

          <select
            value={project.videoFormat}
            onChange={(e) => updateProject({ videoFormat: e.target.value })}
            style={{ padding: '8px 10px' }}
          >
            {VIDEO_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          <button className="btn btn-ghost" onClick={handleShare}>
            {copied ? 'Lien copié ✓' : 'Partager'}
          </button>
        </div>
      </header>

      {error && (
        <div
          className="card"
          style={{ padding: 16, margin: '16px 28px', borderColor: '#e5484d', color: '#e5484d' }}
        >
          {error}
        </div>
      )}

      {view === 'script' ? (
        <ScriptView script={project.script} onChange={(script) => updateProject({ script })} />
      ) : (
        <StoryboardView
          storyboard={project.storyboard}
          onChange={(storyboard) => updateProject({ storyboard })}
        />
      )}
    </div>
  )
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        background: active ? 'linear-gradient(135deg, var(--accent), var(--accent-deep))' : 'transparent',
        color: active ? '#06121f' : 'var(--text-dim)',
      }}
    >
      {children}
    </button>
  )
}
