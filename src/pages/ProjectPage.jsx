import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { VIDEO_FORMATS, STATUSES, getDefaultView } from '../utils/storage.js'
import { loadProjectBySlug, updateProjectRow } from '../utils/projectsApi.js'
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
import Loader from '../components/Loader.jsx'
import FilterButton from '../components/FilterButton.jsx'
import ClientSidebar from '../components/ClientSidebar.jsx'

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromDashboard = Boolean(location.state?.fromDashboard)
  const readOnly = !fromDashboard
  const [project, setProject] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [localView, setLocalView] = useState(null)
  const [localFormat, setLocalFormat] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [feedbackFilter, setFeedbackFilter] = useState('pending')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileClientSidebarOpen, setMobileClientSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    // contentRect excludes padding/border, which undercounts this header's real
    // rendered height (it has both) — measure the border box instead so
    // --header-h matches where the header visually ends.
    const observer = new ResizeObserver(() => setHeaderHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    setHeaderHeight(el.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [project])

  useEffect(() => {
    setLoading(true)
    setLocalView(null)
    setLocalFormat(null)
    loadProjectBySlug(slug).then(setProject).finally(() => setLoading(false))
  }, [slug])

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
    if (!project) return
    const next = { ...project, ...patch, updatedAt: new Date().toISOString() }
    setProject(next)
    try {
      await updateProjectRow(next)
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

  if (loading) {
    return <Loader />
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

  const view = localView ?? getDefaultView(project.status)
  const format = readOnly ? localFormat ?? project.videoFormat : project.videoFormat
  const pendingTargetIds = new Set(
    feedback.filter((f) => !f.completed && f.targetId).map((f) => f.targetId)
  )

  function setView(v) {
    setLocalView(v)
  }

  function setFormat(v) {
    if (readOnly) setLocalFormat(v)
    else updateProject({ videoFormat: v })
  }

  const pendingCount = feedback.filter((f) => !f.completed).length
  const statusInfo = STATUSES.find((s) => s.value === project.status) || STATUSES[0]
  const statusIndex = STATUSES.findIndex((s) => s.value === project.status)
  const progress = statusIndex === -1 ? 0 : Math.round((statusIndex / (STATUSES.length - 1)) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        ref={headerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '20px 32px 24px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 760, gap: 12 }}>
          {fromDashboard ? (
            <button className="btn-icon" onClick={() => navigate('/dashboard')} title="Retour">
              ←
            </button>
          ) : (
            <div style={{ width: 32, flexShrink: 0 }} />
          )}

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 19,
              overflowWrap: 'anywhere',
            }}
          >
            {project.name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <button className="btn-icon" onClick={handleShare} title="Partager le lien">
              {copied ? '✓' : '🔗'}
            </button>
            <button
              type="button"
              className="btn-icon sidebar-toggle-mobile"
              title="Documents & codes"
              onClick={() => setMobileClientSidebarOpen((v) => !v)}
            >
              📁
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
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span
            className="badge"
            style={{
              background: `${statusInfo.color}22`,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}55`,
              boxShadow: `0 0 9px 1px ${statusInfo.color}77`,
              fontWeight: 600,
            }}
          >
            {statusInfo.label}
          </span>
          {(project.startDate || project.dueDate) && (
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              📅{' '}
              {project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '?'}
              {' → '}
              {project.dueDate ? new Date(project.dueDate).toLocaleDateString('fr-FR') : '?'}
            </span>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: 380 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              color: 'var(--text-faint)',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <span>Avancement</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'var(--card-alt)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, var(--accent-deep), var(--accent))',
                boxShadow: '0 0 10px 1px rgba(74, 173, 245, 0.7)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
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
            style={{ padding: '8px 12px' }}
          >
            {VIDEO_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div
        className="project-page-layout"
        style={{ display: 'flex', flex: 1, '--header-h': `${headerHeight}px` }}
      >
      <ClientSidebar
        project={{ ...project, clientName: project.client }}
        onUpdateProject={updateProject}
        readOnly={readOnly}
        className={`client-sidebar-panel${mobileClientSidebarOpen ? ' open' : ''}`}
        onMobileClose={() => setMobileClientSidebarOpen(false)}
      />
      <div className="project-content" style={{ flex: 1, minWidth: 0 }}>
      {error && (
        <div
          className="card"
          style={{ padding: 16, margin: '16px 32px', borderColor: '#e5484d', color: '#e5484d' }}
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
          format={format}
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
            marginBottom: 20,
          }}
        >
          Astuce : cliquez sur 💬 directement sur un plan, une section ou la vidéo pour cibler votre retour.
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <FilterButton
          active={feedbackFilter === 'pending'}
          onClick={() => setFeedbackFilter('pending')}
          style={{ flex: 1 }}
        >
          Non complété
        </FilterButton>
        <FilterButton
          active={feedbackFilter === 'completed'}
          onClick={() => setFeedbackFilter('completed')}
          style={{ flex: 1 }}
        >
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
            <div key={category} style={{ marginBottom: 20 }}>
              <h4
                style={{
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-dim)',
                  marginBottom: 12,
                }}
              >
                {category}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                              marginBottom: 8,
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
                          className="btn-icon danger"
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
    </div>
  )
}

function ToggleButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`toggle-btn${active ? ' active' : ''}`}
    >
      {children}
    </button>
  )
}
