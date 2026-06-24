import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Link2,
  CheckCircle2,
  Folder,
  MessageSquare,
  Calendar,
  FileText,
  LayoutGrid,
  PlayCircle,
  Sun,
  Moon,
  X,
  AlertCircle,
  Pin,
  Trash2,
} from 'lucide-react'
import { VIDEO_FORMATS, STATUSES, getDefaultView } from '../utils/storage.js'
import { loadProjectBySlug, updateProjectRow } from '../utils/projectsApi.js'
import {
  loadFeedbackForProject,
  addFeedback,
  setFeedbackCompleted,
  deleteFeedback,
  getFeedbackCategory,
  feedbackMatchesActiveVersion,
  FEEDBACK_CATEGORIES,
  FEEDBACK_CATEGORY_TO_VERSION_KEY,
} from '../utils/feedbackApi.js'
import {
  ensureVersionsSeeded,
  loadVersionMetas,
  loadActiveVersions,
  loadVersion,
  createVersion,
  setActiveVersion,
  updateVersionData,
  deleteVersion,
} from '../utils/versionsApi.js'
import { useTheme } from '../hooks/useTheme.js'
import ScriptView from '../components/ScriptView.jsx'
import StoryboardView from '../components/StoryboardView.jsx'
import VideoView from '../components/VideoView.jsx'
import Loader from '../components/Loader.jsx'
import FilterButton from '../components/FilterButton.jsx'
import ClientSidebar from '../components/ClientSidebar.jsx'
import VersionSelector from '../components/VersionSelector.jsx'

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const fromDashboard = Boolean(location.state?.fromDashboard)
  const readOnly = !fromDashboard
  const { theme, toggleTheme } = useTheme()
  const [project, setProject] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [localView, setLocalView] = useState(null)
  const [localFormat, setLocalFormat] = useState(null)
  const [feedback, setFeedback] = useState([])
  const [feedbackFilter, setFeedbackFilter] = useState('pending')
  // One active version per category (script/storyboard/video), each with its
  // full data payload, plus the lightweight list of all versions (no `data`)
  // used to render the V1/V2/V3 pills.
  const [activeVersions, setActiveVersions] = useState({})
  const [versionMetas, setVersionMetas] = useState([])
  const [versionBusy, setVersionBusy] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileClientSidebarOpen, setMobileClientSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [flashTargetId, setFlashTargetId] = useState(null)
  const flashTimerRef = useRef(null)
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
    // `loading` is in the deps too: the header isn't in the DOM at all while
    // loading (a <Loader/> is rendered instead), so headerRef.current is null
    // on the render where `project` first gets set. Without re-running once
    // `loading` flips to false, the observer never attaches to the real
    // header and --header-h stays stuck at 0 — exactly the mobile bug where
    // content rendered right under/behind the fixed header.
  }, [project, loading])

  useEffect(() => {
    setLoading(true)
    setLocalView(null)
    setLocalFormat(null)
    setActiveVersions({})
    setVersionMetas([])
    clearTimeout(flashTimerRef.current)
    setFlashTargetId(null)
    let cancelled = false
    loadProjectBySlug(slug)
      .then(async (p) => {
        if (cancelled) return
        setProject(p)
        if (!p) return
        // Self-healing: seeds a V1 per category from the legacy script/
        // storyboard/video_url columns the first time a pre-versioning
        // project is opened. No-op once versions already exist.
        await ensureVersionsSeeded(p)
        const [metas, active] = await Promise.all([loadVersionMetas(p.id), loadActiveVersions(p.id)])
        if (cancelled) return
        setVersionMetas(metas)
        setActiveVersions(active)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
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
    const category = FEEDBACK_CATEGORY_TO_VERSION_KEY[getFeedbackCategory({ targetType: target?.type })]
    const versionNumber = activeVersions[category]?.versionNumber ?? 1
    await addFeedback(project.id, message, target, versionNumber)
    await refreshFeedback()
  }

  // Each category's edits are written to its active version row in
  // studio_versions instead of the project row — script/storyboard/video_url
  // on studio_projects are only the historical V1 seed at this point.
  async function updateScriptData(script) {
    const version = activeVersions.script
    if (!version) return
    setActiveVersions((prev) => ({ ...prev, script: { ...prev.script, data: script } }))
    try {
      await updateVersionData(version.id, script)
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateStoryboardData(storyboard) {
    const version = activeVersions.storyboard
    if (!version) return
    setActiveVersions((prev) => ({ ...prev, storyboard: { ...prev.storyboard, data: storyboard } }))
    try {
      await updateVersionData(version.id, storyboard)
    } catch (err) {
      setError(err.message)
    }
  }

  async function updateVideoUrl(videoUrl) {
    const version = activeVersions.video
    if (!version) return
    const data = { videoUrl }
    setActiveVersions((prev) => ({ ...prev, video: { ...prev.video, data } }))
    try {
      await updateVersionData(version.id, data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSelectVersion(category, versionMeta) {
    if (!project || versionMeta.id === activeVersions[category]?.id) return
    setVersionBusy(true)
    try {
      await setActiveVersion(project.id, category, versionMeta.id)
      const full = await loadVersion(versionMeta.id)
      setActiveVersions((prev) => ({ ...prev, [category]: full }))
      setVersionMetas((prev) =>
        prev.map((m) => (m.category === category ? { ...m, isActive: m.id === versionMeta.id } : m))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setVersionBusy(false)
    }
  }

  async function handleCreateVersion(category) {
    if (!project) return
    const current = activeVersions[category]
    if (!current) return
    setVersionBusy(true)
    try {
      const created = await createVersion(project.id, category, current.data)
      setActiveVersions((prev) => ({ ...prev, [category]: created }))
      setVersionMetas((prev) => [
        ...prev.map((m) => (m.category === category ? { ...m, isActive: false } : m)),
        {
          id: created.id,
          projectId: created.projectId,
          category,
          versionNumber: created.versionNumber,
          isActive: true,
          createdAt: created.createdAt,
        },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setVersionBusy(false)
    }
  }

  async function handleDeleteVersion(category, versionMeta) {
    if (!project) return
    if (!confirm(`Supprimer la version V${versionMeta.versionNumber} ? Cette action est irréversible.`)) return
    setVersionBusy(true)
    try {
      const { activeVersion } = await deleteVersion(project.id, category, versionMeta.id)
      setVersionMetas((prev) => {
        const remaining = prev.filter((m) => m.id !== versionMeta.id)
        if (!activeVersion) return remaining
        return remaining.map((m) =>
          m.category === category ? { ...m, isActive: m.id === activeVersion.id } : m
        )
      })
      if (activeVersion) {
        setActiveVersions((prev) => ({ ...prev, [category]: activeVersion }))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setVersionBusy(false)
    }
  }

  async function handleToggleCompleted(f) {
    await setFeedbackCompleted(f.id, !f.completed)
    await refreshFeedback()
  }

  async function handleDeleteFeedback(f) {
    if (!confirm('Supprimer ce retour ? Cette action est irréversible.')) return
    await deleteFeedback(f.id)
    await refreshFeedback()
  }

  // Admin-only: jump to the script section / storyboard plan a feedback item
  // targets, switching tab and expanding its storyboard section if needed.
  function scrollToFeedbackTarget(f) {
    if (readOnly || !f.targetId) return
    const category = getFeedbackCategory(f)
    if (category === 'Script') setLocalView('script')
    else if (category === 'Storyboard') {
      setLocalView('storyboard')
      setActiveVersions((prev) => {
        const storyboard = prev.storyboard?.data
        if (!storyboard) return prev
        const sections = storyboard.sections.map((s) =>
          s.collapsed && s.plans.some((p) => p.id === f.targetId) ? { ...s, collapsed: false } : s
        )
        return { ...prev, storyboard: { ...prev.storyboard, data: { ...storyboard, sections } } }
      })
    } else return

    clearTimeout(flashTimerRef.current)
    requestAnimationFrame(() => {
      setTimeout(() => {
        const el = document.getElementById(`fb-target-${f.targetId}`)
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setFlashTargetId(f.targetId)
        flashTimerRef.current = setTimeout(() => setFlashTargetId(null), 1500)
      }, 80)
    })
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

  // Falls back to the legacy project columns if a version hasn't loaded yet
  // (or failed to seed) so the page never crashes mid-transition.
  const scriptData = activeVersions.script?.data ?? project.script
  const storyboardData = activeVersions.storyboard?.data ?? project.storyboard
  const videoUrl = activeVersions.video?.data?.videoUrl ?? project.videoUrl
  const activeVersionNumbers = {
    script: activeVersions.script?.versionNumber ?? 1,
    storyboard: activeVersions.storyboard?.versionNumber ?? 1,
    video: activeVersions.video?.versionNumber ?? 1,
  }
  const versionScopedFeedback = feedback.filter((f) => feedbackMatchesActiveVersion(f, activeVersionNumbers))

  const pendingTargetIds = new Set(
    versionScopedFeedback.filter((f) => !f.completed && f.targetId).map((f) => f.targetId)
  )

  function setView(v) {
    setLocalView(v)
  }

  function setFormat(v) {
    if (readOnly) setLocalFormat(v)
    else updateProject({ videoFormat: v })
  }

  const pendingCount = versionScopedFeedback.filter((f) => !f.completed).length
  const statusInfo = STATUSES.find((s) => s.value === project.status) || STATUSES[0]
  const statusIndex = STATUSES.findIndex((s) => s.value === project.status)
  const progress = statusIndex === -1 ? 0 : Math.round((statusIndex / (STATUSES.length - 1)) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        ref={headerRef}
        className="project-header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          padding: '20px 32px 24px',
          background: 'var(--bg-header)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
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
              <ArrowLeft size={18} />
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
            <button
              type="button"
              className="btn-icon"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? <Sun size={17} className="theme-toggle-icon" /> : <Moon size={17} className="theme-toggle-icon" />}
            </button>
            <button className="btn-icon" onClick={handleShare} title="Partager le lien">
              {copied ? <CheckCircle2 size={17} /> : <Link2 size={17} />}
            </button>
            <button
              type="button"
              className="btn-icon sidebar-toggle-mobile"
              title="Documents & codes"
              onClick={() => setMobileClientSidebarOpen((v) => !v)}
            >
              <Folder size={17} />
            </button>
            <button
              type="button"
              className="btn-icon sidebar-toggle-mobile"
              title="Retours client"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              style={{ position: 'relative' }}
            >
              <MessageSquare size={17} />
              {pendingCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--red)',
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}>
              <Calendar size={13} />
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
              className="progress-fill"
              style={{
                height: '100%',
                width: `${progress}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, var(--accent-deep), var(--accent-glow))',
                boxShadow: '0 0 10px 2px rgba(96, 165, 250, 0.6)',
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
              <FileText size={14} /> Script
            </ToggleButton>
            <ToggleButton active={view === 'storyboard'} onClick={() => setView('storyboard')}>
              <LayoutGrid size={14} /> Storyboard
            </ToggleButton>
            <ToggleButton active={view === 'video'} onClick={() => setView('video')}>
              <PlayCircle size={14} /> Vidéo
            </ToggleButton>
          </div>

          {fromDashboard ? (
            <VersionSelector
              versions={versionMetas.filter((m) => m.category === view)}
              activeVersionId={activeVersions[view]?.id}
              onSelect={(v) => handleSelectVersion(view, v)}
              onCreate={() => handleCreateVersion(view)}
              onDelete={(v) => handleDeleteVersion(view, v)}
              creating={versionBusy}
            />
          ) : (
            activeVersions[view] && (
              // Read-only label, not a selector: the client always sees the
              // active version and just needs to know which one it is.
              <div className="card" style={{ display: 'flex', padding: 4, gap: 4 }}>
                <span className="toggle-btn sm active" style={{ cursor: 'default' }}>
                  V{activeVersions[view].versionNumber}
                </span>
              </div>
            )
          )}

          <div className="card" style={{ display: 'flex', padding: 4, gap: 4 }}>
            {VIDEO_FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`toggle-btn sm${format === f.value ? ' active' : ''}`}
                onClick={() => setFormat(f.value)}
                title={f.label}
              >
                {f.value}
              </button>
            ))}
          </div>
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
      <div className="project-content fade-in" style={{ flex: 1, minWidth: 0 }}>
      {error && (
        <div
          className="card"
          style={{ padding: 16, margin: '16px 32px', borderColor: 'var(--red)', color: 'var(--red)' }}
        >
          {error}
        </div>
      )}

      {view === 'script' && (
        <ScriptView
          script={scriptData}
          onChange={updateScriptData}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlightedIds={pendingTargetIds}
          flashId={flashTargetId}
          projectId={project.id}
          projectName={project.name}
        />
      )}
      {view === 'storyboard' && (
        <StoryboardView
          storyboard={storyboardData}
          onChange={updateStoryboardData}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlightedIds={pendingTargetIds}
          flashId={flashTargetId}
          format={format}
          projectName={project.name}
        />
      )}
      {view === 'video' && (
        <VideoView
          videoUrl={videoUrl}
          onChange={readOnly ? undefined : updateVideoUrl}
          onComment={readOnly ? handleTargetedComment : undefined}
          readOnly={readOnly}
          highlighted={pendingTargetIds.has('video')}
          feedbackItems={versionScopedFeedback.filter((f) => getFeedbackCategory(f) === 'Vidéo')}
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
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      <div className="feedback-sidebar-scroll" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} /> Retours client
        </h3>
        <button
          type="button"
          className="btn-icon sidebar-toggle-mobile"
          onClick={() => setMobileSidebarOpen(false)}
          title="Masquer"
        >
          <X size={16} />
        </button>
      </div>

      {readOnly && (
        <div className="hint-line" style={{ marginBottom: 20 }}>
          <MessageSquare size={14} />
          <span>
            Astuce : cliquez sur l'icône de commentaire directement sur un plan, une section ou la
            vidéo pour cibler votre retour.
          </span>
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
        const visible = versionScopedFeedback.filter(
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
                  <div
                    key={f.id}
                    className="card"
                    style={{
                      padding: 12,
                      cursor: !readOnly && f.targetId ? 'pointer' : undefined,
                    }}
                    onClick={!readOnly && f.targetId ? () => scrollToFeedbackTarget(f) : undefined}
                    title={!readOnly && f.targetId ? 'Cliquer pour aller à la frame concernée' : undefined}
                  >
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      {!readOnly && (
                        <button
                          type="button"
                          title={f.completed ? 'Marquer comme non complété' : 'Marquer comme complété'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleCompleted(f)
                          }}
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
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            color: f.completed ? 'var(--green)' : 'var(--amber)',
                            marginBottom: 8,
                          }}
                        >
                          {f.completed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {f.completed ? 'Complété' : 'À traiter'}
                        </div>
                        {f.targetLabel && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              marginBottom: 8,
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                          >
                            <Pin size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                            {f.targetLabel}
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
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFeedback(f)
                          }}
                          className="btn-icon danger"
                          style={{ flexShrink: 0 }}
                        >
                          <X size={14} />
                        </button>
                      )}
                      {!readOnly && f.completed && (
                        <button
                          type="button"
                          title="Supprimer ce retour"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFeedback(f)
                          }}
                          className="btn-icon danger"
                          style={{ flexShrink: 0 }}
                        >
                          <Trash2 size={14} />
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
      </div>
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
