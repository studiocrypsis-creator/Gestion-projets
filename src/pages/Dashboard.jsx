import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sun, Moon } from 'lucide-react'
import { slugify, createNewProject, STATUSES, TAG_OPTIONS, STATUS_GROUPS } from '../utils/storage.js'
import { loadProjectSummaries, insertProject, updateProjectRow, deleteProjectRow } from '../utils/projectsApi.js'
import { loadFeedbackCounts } from '../utils/feedbackApi.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { useTheme } from '../hooks/useTheme.js'
import ProjectCard from '../components/ProjectCard.jsx'
import EditProjectModal from '../components/EditProjectModal.jsx'
import AdminSidebar from '../components/AdminSidebar.jsx'
import Loader from '../components/Loader.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusGroupFilter, setStatusGroupFilter] = useState('all')
  const [editingProject, setEditingProject] = useState(null)
  const [error, setError] = useState('')
  const [feedbackCounts, setFeedbackCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeaderHeight(el.getBoundingClientRect().height))
    observer.observe(el)
    setHeaderHeight(el.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [])

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [price, setPrice] = useState('')
  const [promoCodeName, setPromoCodeName] = useState('')
  const [promoCodeValue, setPromoCodeValue] = useState('')
  const [affiliationCode, setAffiliationCode] = useState('')

  useEffect(() => {
    Promise.all([loadProjectSummaries().then(setProjects), loadFeedbackCounts().then(setFeedbackCounts)]).finally(() =>
      setLoading(false)
    )
  }, [])

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name))
  }, [name, slugTouched])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    let finalSlug = slugify(slug || name)
    if (!finalSlug) finalSlug = `projet-${Date.now()}`
    const existing = projects.some((p) => p.slug === finalSlug)
    if (existing) finalSlug = `${finalSlug}-${Math.random().toString(36).slice(2, 5)}`

    const project = createNewProject({
      name: name.trim(),
      client: client.trim(),
      slug: finalSlug,
      startDate,
      dueDate,
      price,
      promoCodeName,
      promoCodeValue,
      affiliationCode,
    })
    setProjects([project, ...projects])
    setName('')
    setClient('')
    setSlug('')
    setSlugTouched(false)
    setStartDate('')
    setDueDate('')
    setPrice('')
    setPromoCodeName('')
    setPromoCodeValue('')
    setAffiliationCode('')
    try {
      await insertProject(project)
    } catch (err) {
      setError(err.message)
      setProjects((prev) => prev.filter((p) => p.id !== project.id))
    }
  }

  async function updateProject(id, patch) {
    const current = projects.find((p) => p.id === id)
    if (!current) return
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() }
    setProjects((prev) => prev.map((p) => (p.id === id ? next : p)))
    try {
      await updateProjectRow(next)
    } catch (err) {
      setError(err.message)
    }
  }

  async function deleteProject(id) {
    if (!confirm('Supprimer définitivement ce projet ?')) return
    setProjects((prev) => prev.filter((p) => p.id !== id))
    try {
      await deleteProjectRow(id)
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleArchive(id) {
    const proj = projects.find((p) => p.id === id)
    updateProject(id, { archived: !proj.archived })
  }

  const searchTypeFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      const matchesType = typeFilter === 'all' || p.tags.includes(typeFilter)
      return matchesSearch && matchesType
    })
  }, [projects, search, typeFilter])

  const filtered = useMemo(() => {
    if (statusGroupFilter === 'all') return searchTypeFiltered
    const statuses = STATUS_GROUPS[statusGroupFilter].statuses
    return searchTypeFiltered.filter((p) => statuses.includes(p.status))
  }, [searchTypeFiltered, statusGroupFilter])

  const isArchived = (p) => p.archived || p.status === 'termine'
  const activeProjects = filtered.filter((p) => !isArchived(p))
  const archivedProjects = filtered.filter((p) => isArchived(p))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        ref={headerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 32px',
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
        <span className="logo-chip">
          <img
            src="/logo.png"
            alt="Crypsis Studio"
            style={{ height: 36, display: 'block', filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.45))' }}
          />
        </span>
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{ position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)' }}
        >
          {theme === 'dark' ? (
            <Sun size={18} className="theme-toggle-icon" />
          ) : (
            <Moon size={18} className="theme-toggle-icon" />
          )}
        </button>
      </header>

      <div className="dashboard-layout" style={{ display: 'flex', flex: 1, '--header-h': `${headerHeight}px` }}>
      <AdminSidebar
        className="admin-sidebar-panel slide-in-left"
        projects={searchTypeFiltered}
        allProjects={projects}
        activeGroup={statusGroupFilter}
        onSelectGroup={setStatusGroupFilter}
      />
      <main style={{ flex: 1, minWidth: 0, maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        {!isSupabaseConfigured && (
          <div
            className="card"
            style={{ padding: 16, marginBottom: 24, borderColor: 'var(--amber)', color: 'var(--amber)' }}
          >
            Supabase n'est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants). Les
            données ne seront pas sauvegardées.
          </div>
        )}
        {error && (
          <div
            className="card"
            style={{ padding: 16, marginBottom: 24, borderColor: 'var(--red)', color: 'var(--red)' }}
          >
            {error}
          </div>
        )}
        <form
          onSubmit={handleCreate}
          className="card fade-in"
          style={{
            padding: 24,
            marginBottom: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16,
            alignItems: 'end',
          }}
        >
          <Field label="Nom du projet">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Smart Invest Immo"
              style={{ width: '100%', padding: '12px 12px' }}
              required
            />
          </Field>
          <Field label="Nom du client">
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ex: Smart Invest"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Slug (URL unique)">
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugTouched(true)
              }}
              placeholder="smart-invest-immo-pr"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Date de début (privé)">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Date de livraison (privé)">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Prix (privé)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 1500"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Nom du code promo (visible client)">
            <input
              value={promoCodeName}
              onChange={(e) => setPromoCodeName(e.target.value)}
              placeholder="Ex: WELCOME20"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Valeur du code promo (visible client)">
            <input
              value={promoCodeValue}
              onChange={(e) => setPromoCodeValue(e.target.value)}
              placeholder="Ex: -20%"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <Field label="Code d'affiliation client (visible client)">
            <input
              value={affiliationCode}
              onChange={(e) => setAffiliationCode(e.target.value)}
              placeholder="Ex: AFF-CLIENT-2026"
              style={{ width: '100%', padding: '12px 12px' }}
            />
          </Field>
          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
            + Créer le projet
          </button>
        </form>

        <div className="dashboard-filters" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, code, statut..."
              style={{ width: '100%', padding: '12px 16px 12px 38px' }}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '12px 16px', minWidth: 0 }}
          >
            <option value="all">Tous les types</option>
            {TAG_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loader fullScreen={false} />
        ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {activeProjects.map((p, i) => (
            <div key={p.id} className="fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
            <ProjectCard
              project={p}
              feedbackCounts={feedbackCounts[p.id]}
              onOpen={() => navigate(`/projet/${p.slug}`, { state: { fromDashboard: true } })}
              onEdit={() => setEditingProject(p)}
              onArchive={() => toggleArchive(p.id)}
              onDelete={() => deleteProject(p.id)}
              onStatusChange={(status) => updateProject(p.id, { status })}
            />
            </div>
          ))}
          {activeProjects.length === 0 && (
            <div style={{ color: 'var(--text-faint)', padding: '24px 4px' }}>
              Aucun projet trouvé.
            </div>
          )}
        </div>
        )}

        {!loading && archivedProjects.length > 0 && (
          <>
            <h3
              style={{
                marginTop: 48,
                marginBottom: 16,
                color: 'var(--text-dim)',
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Projets archivés
            </h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                opacity: 0.6,
              }}
            >
              {archivedProjects.map((p, i) => (
                <div key={p.id} className="fade-in-up" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
                <ProjectCard
                  project={p}
                  feedbackCounts={feedbackCounts[p.id]}
                  onOpen={() => navigate(`/projet/${p.slug}`, { state: { fromDashboard: true } })}
                  onEdit={() => setEditingProject(p)}
                  onArchive={() => toggleArchive(p.id)}
                  onDelete={() => deleteProject(p.id)}
                  onStatusChange={(status) => updateProject(p.id, { status })}
                />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      </div>

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={(patch) => {
            updateProject(editingProject.id, patch)
            setEditingProject(null)
          }}
        />
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  )
}
