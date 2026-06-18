import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { slugify, createNewProject, STATUSES, TAG_OPTIONS } from '../utils/storage.js'
import { loadProjects, insertProject, updateProjectRow, deleteProjectRow } from '../utils/projectsApi.js'
import { loadFeedbackCounts } from '../utils/feedbackApi.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import ProjectCard from '../components/ProjectCard.jsx'
import EditProjectModal from '../components/EditProjectModal.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingProject, setEditingProject] = useState(null)
  const [error, setError] = useState('')
  const [feedbackCounts, setFeedbackCounts] = useState({})

  const [name, setName] = useState('')
  const [client, setClient] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    loadProjects().then(setProjects)
    loadFeedbackCounts().then(setFeedbackCounts)
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
    })
    setProjects([project, ...projects])
    setName('')
    setClient('')
    setSlug('')
    setSlugTouched(false)
    setStartDate('')
    setDueDate('')
    setPrice('')
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

  const filtered = useMemo(() => {
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

  const activeProjects = filtered.filter((p) => !p.archived)
  const archivedProjects = filtered.filter((p) => p.archived)

  return (
    <div>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" alt="Crypsis Studio" style={{ height: 52, display: 'block' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'var(--card-alt)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            CS
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        {!isSupabaseConfigured && (
          <div
            className="card"
            style={{ padding: 16, marginBottom: 24, borderColor: '#f5a623', color: '#f5a623' }}
          >
            Supabase n'est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants). Les
            données ne seront pas sauvegardées.
          </div>
        )}
        {error && (
          <div
            className="card"
            style={{ padding: 16, marginBottom: 24, borderColor: '#e5484d', color: '#e5484d' }}
          >
            {error}
          </div>
        )}
        <form
          onSubmit={handleCreate}
          className="card"
          style={{
            padding: 24,
            marginBottom: 32,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            alignItems: 'end',
          }}
        >
          <Field label="Nom du projet">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Smart Invest Immo"
              style={{ width: '100%', padding: '10px 12px' }}
              required
            />
          </Field>
          <Field label="Nom du client">
            <input
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ex: Smart Invest"
              style={{ width: '100%', padding: '10px 12px' }}
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
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </Field>
          <Field label="Date de début (privé)">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </Field>
          <Field label="Date de livraison (privé)">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '10px 12px' }}
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
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </Field>
          <button type="submit" className="btn btn-primary" style={{ height: 42 }}>
            + Créer le projet
          </button>
        </form>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, code, statut..."
            style={{ flex: 1, padding: '10px 14px' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ padding: '10px 14px' }}
          >
            <option value="all">Tous les types</option>
            {TAG_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {activeProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              feedbackCount={feedbackCounts[p.id] || 0}
              onOpen={() => navigate(`/projet/${p.slug}`, { state: { fromDashboard: true } })}
              onEdit={() => setEditingProject(p)}
              onArchive={() => toggleArchive(p.id)}
              onDelete={() => deleteProject(p.id)}
            />
          ))}
          {activeProjects.length === 0 && (
            <div style={{ color: 'var(--text-faint)', padding: '24px 4px' }}>
              Aucun projet trouvé.
            </div>
          )}
        </div>

        {archivedProjects.length > 0 && (
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
              {archivedProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  feedbackCount={feedbackCounts[p.id] || 0}
                  onOpen={() => navigate(`/projet/${p.slug}`, { state: { fromDashboard: true } })}
                  onEdit={() => setEditingProject(p)}
                  onArchive={() => toggleArchive(p.id)}
                  onDelete={() => deleteProject(p.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

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
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  )
}
