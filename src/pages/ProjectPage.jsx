import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { VIDEO_FORMATS } from '../utils/storage.js'
import { loadProjects, updateProjectRow } from '../utils/projectsApi.js'
import {
  loadFeedbackForProject,
  addFeedback,
  setFeedbackCompleted,
  deleteFeedback,
  getFeedbackCategory,
  FEEDBACK_CATEGORIES,
} from '../utils/feedbackApi.js'
import ScriptView from '../components/ScriptView.jsx'
import StoryboardView from '../components/StoryboardView.jsx'
import VideoView from '../components/VideoView.jsx'

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
  const [feedbackFilter, setFeedbackFilter] = useState('pending')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    loadProjects().then(setProjects)
  }, [])

  const project = projects.find((p) => p.slug === slug)
  const projectIndex = projects.findIndex((p) => p.slug === slug)

  useEffect(() => {
    if (project) {
      loadFeedbackForProject(project.id).then(setFeedback)
    }
  }, [project?.id])

  async function refreshFeedback() {
    if (project) setFeedback(await loadFeedbackForProject(project.id))
  }

  async function handleTargetedComment(target, message) {
    if (!project) return
    await addFeedback(project.id, message, target)
    await refreshFeedback()
  }

  async function handleToggleCompleted(f) {
    await setFeedbackCompleted(f.id, !f.completed)
    await refreshFeedback()
  }

  async function handleDeleteFeedback(f) {
    if (!confirm('Supprimer ce retour ?')) return
    await deleteFeedback(f.id)
    await refreshFeedback()
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
  const pendingTargetIds = new Set(
    feedback.filter((f) => !f.completed && f.targetId).map((f) => f.targetId)
  )

  function setView(v) {
    if (readOnly) setLocalView(v)
    else updateProject({ activeView: v })
  }

  function setFormat(v) {
    if (readOnly) setLocalFormat(v)
    else updateProject({ videoFormat: v })
  }

  const pendingCount = feedback.filter((f) => !f.completed).length

  return (
    <div className="project-page-layout" style={{ display: 'flex' }}>
    <div className="project-content" style={{ flex: 1, minWidth: 0 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 10,
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

        <div style={{ fontWeight: 700, fontSize: 16, flex: 1, minWidth: 0, textAlign: 'center' }}>
          {project.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
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
            <ToggleButton active={view === 'video'} onClick={() => setView('video')}>
              Vidéo
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

          <button
            type="button"
            className="btn-icon sidebar-toggle-mobile"
            title="Retours client"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            style={{ position: 'relative' }}
          >
            💬
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#e5484d',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {pendingCount}
              </span>
            )}
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

      {view === 'script' && (
        <ScriptView
          script={project.script}
          onChange={(script) => updateProject({ script })}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlightedIds={pendingTargetIds}
        />
      )}
      {view === 'storyboard' && (
        <StoryboardView
          storyboard={project.storyboard}
          onChange={(storyboard) => updateProject({ storyboard })}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlightedIds={pendingTargetIds}
        />
      )}
      {view === 'video' && (
        <VideoView
          videoUrl={project.videoUrl}
          onChange={readOnly ? undefined : (videoUrl) => updateProject({ videoUrl })}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlighted={pendingTargetIds.has('video')}
          feedbackItems={feedback.filter((f) => getFeedbackCategory(f) === 'Vidéo')}
          onToggleCompleted={handleToggleCompleted}
          onDeleteFeedback={handleDeleteFeedback}
        />
      )}
    </div>

    <aside
      className={`feedback-sidebar${mobileSidebarOpen ? ' open' : ''}`}
      style={{
        width: 320,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--bg-header)',
        minHeight: '100vh',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15 }}>Retours client</h3>
        <button
          type="button"
          className="btn-icon sidebar-toggle-mobile"
          onClick={() => setMobileSidebarOpen(false)}
          title="Masquer"
        >
          ✕
        </button>
      </div>

      {readOnly && (
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--accent)',
            textShadow: '0 0 8px var(--accent)',
            marginBottom: 18,
          }}
        >
          Astuce : cliquez sur 💬 directement sur un plan, une section ou la vidéo pour cibler votre retour.
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <FilterButton active={feedbackFilter === 'pending'} onClick={() => setFeedbackFilter('pending')}>
          Non complété
        </FilterButton>
        <FilterButton active={feedbackFilter === 'completed'} onClick={() => setFeedbackFilter('completed')}>
          Complété
        </FilterButton>
      </div>

      {(() => {
        const visible = feedback.filter(
          (f) =>
            (feedbackFilter === 'completed' ? f.completed : !f.completed) &&
            getFeedbackCategory(f) !== 'Vidéo'
        )
        if (visible.length === 0) {
          return (
            <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>
              {feedbackFilter === 'completed' ? 'Aucun retour complété.' : 'Aucun retour en attente.'}
            </div>
          )
        }
        return FEEDBACK_CATEGORIES.filter((c) => c !== 'Vidéo').map((category) => {
          const items = visible.filter((f) => getFeedbackCategory(f) === category)
          if (items.length === 0) return null
          return (
            <div key={category} style={{ marginBottom: 18 }}>
              <h4
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-dim)',
                  marginBottom: 10,
                }}
              >
                {category}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((f) => (
                  <div key={f.id} className="card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {!readOnly && (
                        <button
                          type="button"
                          title={f.completed ? 'Marquer comme non complété' : 'Marquer comme complété'}
                          onClick={() => handleToggleCompleted(f)}
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: `2px solid ${f.completed ? 'var(--accent)' : 'var(--border)'}`,
                            background: f.completed ? 'var(--accent)' : 'transparent',
                            flexShrink: 0,
                            marginTop: 2,
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {f.targetLabel && (
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              marginBottom: 6,
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                          >
                            📌 {f.targetLabel}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            wordBreak: 'break-word',
                            opacity: f.completed ? 0.6 : 1,
                            textDecoration: f.completed ? 'line-through' : 'none',
                          }}
                        >
                          {f.message}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
                          {new Date(f.createdAt).toLocaleString('fr-FR')}
                        </div>
                      </div>
                      {readOnly && !f.completed && (
                        <button
                          type="button"
                          title="Supprimer ce retour"
                          onClick={() => handleDeleteFeedback(f)}
                          className="btn-icon"
                          style={{ flexShrink: 0, fontSize: 12 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      })()}
    </aside>
    </div>
  )
}

function FilterButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn btn-ghost"
      style={{
        flex: 1,
        fontSize: 12,
        padding: '6px 0',
        justifyContent: 'center',
        background: active ? 'var(--accent)' : undefined,
        color: active ? '#06121f' : undefined,
        borderColor: active ? 'var(--accent)' : undefined,
      }}
    >
      {children}
    </button>
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
