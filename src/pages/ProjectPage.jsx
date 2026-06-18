import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { VIDEO_FORMATS } from '../utils/storage.js'
import { loadProjects, updateProjectRow } from '../utils/projectsApi.js'
import { loadFeedbackForProject, addFeedback } from '../utils/feedbackApi.js'
import ScriptView from '../components/ScriptView.jsx'
import StoryboardView from '../components/StoryboardView.jsx'

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromDashboard = Boolean(location.state?.fromDashboard)
  const readOnly = !fromDashboard
  const [projects, setProjects] = useState([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [localView, setLocalView] = useState(null)
  const [localFormat, setLocalFormat] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackError, setFeedbackError] = useState('')

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  const project = projects.find((p) => p.slug === slug)
  const projectIndex = projects.findIndex((p) => p.slug === slug)

  useEffect(() => {
    if (fromDashboard && project) {
      loadFeedbackForProject(project.id).then(setFeedback)
    }
  }, [fromDashboard, project?.id])

  async function handleSendFeedback(e) {
    e.preventDefault()
    if (!feedbackMessage.trim() || !project) return
    try {
      await addFeedback(project.id, feedbackMessage.trim())
      setFeedbackMessage('')
      setFeedbackSent(true)
      setTimeout(() => setFeedbackSent(false), 2500)
    } catch (err) {
      setFeedbackError(err.message)
    }
  }

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

  const view = readOnly ? localView ?? project.activeView ?? 'script' : project.activeView || 'script'
  const format = readOnly ? localFormat ?? project.videoFormat : project.videoFormat

  function setView(v) {
    if (readOnly) setLocalView(v)
    else updateProject({ activeView: v })
  }

  function setFormat(v) {
    if (readOnly) setLocalFormat(v)
    else updateProject({ videoFormat: v })
  }

  return (
    <div style={{ display: 'flex' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
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
            <ToggleButton active={view === 'script'} onClick={() => setView('script')}>
              Script
            </ToggleButton>
            <ToggleButton active={view === 'storyboard'} onClick={() => setView('storyboard')}>
              Storyboard
            </ToggleButton>
          </div>

          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
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
        <ScriptView
          script={project.script}
          onChange={(script) => updateProject({ script })}
          readOnly={readOnly}
        />
      ) : (
        <StoryboardView
          storyboard={project.storyboard}
          onChange={(storyboard) => updateProject({ storyboard })}
          readOnly={readOnly}
        />
      )}
    </div>

    <aside
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-header)',
        minHeight: '100vh',
        padding: 20,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>Retours client</h3>

      {readOnly ? (
        <form onSubmit={handleSendFeedback}>
          <textarea
            value={feedbackMessage}
            onChange={(e) => setFeedbackMessage(e.target.value)}
            placeholder="Laissez votre retour sur ce projet..."
            rows={5}
            style={{ width: '100%', padding: 10, marginBottom: 10, resize: 'vertical' }}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Envoyer le retour
          </button>
          {feedbackSent && (
            <div style={{ marginTop: 10, color: 'var(--accent)', fontSize: 13 }}>
              Merci, votre retour a été envoyé.
            </div>
          )}
          {feedbackError && (
            <div style={{ marginTop: 10, color: '#e5484d', fontSize: 13 }}>{feedbackError}</div>
          )}
        </form>
      ) : feedback.length === 0 ? (
        <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>Aucun retour pour l'instant.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {feedback.map((f) => (
            <div key={f.id} className="card" style={{ padding: 12 }}>
              <div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{f.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                {new Date(f.createdAt).toLocaleString('fr-FR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
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
