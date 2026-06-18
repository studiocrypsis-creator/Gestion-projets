import { useState, useRef, useEffect } from 'react'
import { STATUSES, getScheduleStatus, SCHEDULE_STATUS_INFO } from '../utils/storage.js'

export default function ProjectCard({ project, feedbackCount = 0, onOpen, onEdit, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const menuRef = useRef(null)
  const statusInfo = STATUSES.find((s) => s.value === project.status) || STATUSES[0]
  const scheduleStatus = getScheduleStatus(project)
  const scheduleInfo = scheduleStatus && SCHEDULE_STATUS_INFO[scheduleStatus]

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function copyLink(e) {
    e.stopPropagation()
    const url = `${window.location.origin}${window.location.pathname}#/projet/${project.slug}`
    navigator.clipboard?.writeText(url)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 1800)
  }

  return (
    <div
      className="card"
      onClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault()
        setMenuOpen(true)
      }}
      style={{
        padding: 18,
        cursor: 'pointer',
        position: 'relative',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {feedbackCount > 0 && (
        <div
          title={`${feedbackCount} retour${feedbackCount > 1 ? 's' : ''} client`}
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            minWidth: 22,
            height: 22,
            borderRadius: '50%',
            background: '#e5484d',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            zIndex: 5,
          }}
        >
          {feedbackCount}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {scheduleInfo && (
              <span
                title={scheduleInfo.label}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: scheduleInfo.color,
                  boxShadow: `0 0 8px 2px ${scheduleInfo.color}`,
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ fontWeight: 700, fontSize: 17 }}>{project.name}</div>
          </div>
          <div style={{ color: 'var(--text-faint)', fontSize: 12, marginTop: 2 }}>
            {project.slug}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, position: 'relative' }} ref={menuRef}>
          <button className="btn-icon" title="Copier le lien" onClick={copyLink}>
            🔗
          </button>
          {linkCopied && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                fontSize: 11,
                color: 'var(--accent)',
                whiteSpace: 'nowrap',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                zIndex: 11,
              }}
            >
              Lien copié ✓
            </div>
          )}
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            ⋯
          </button>
          {menuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="card"
              style={{
                position: 'absolute',
                top: 42,
                right: 8,
                zIndex: 10,
                minWidth: 160,
                padding: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <MenuItem onClick={() => { onEdit(); setMenuOpen(false) }}>Éditer</MenuItem>
              <MenuItem onClick={() => { onArchive(); setMenuOpen(false) }}>
                {project.archived ? 'Désarchiver' : 'Archiver'}
              </MenuItem>
              <MenuItem onClick={() => { onDelete(); setMenuOpen(false) }} danger>
                Supprimer
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <span className="badge" style={{ background: `${statusInfo.color}22`, color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>

      {project.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      {(project.startDate || project.dueDate || project.price != null) && (
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-dim)', flexWrap: 'wrap' }}>
          {(project.startDate || project.dueDate) && (
            <span>
              📅{' '}
              {project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '?'}
              {' → '}
              {project.dueDate ? new Date(project.dueDate).toLocaleDateString('fr-FR') : '?'}
            </span>
          )}
          {project.price != null && <span>💶 {project.price.toLocaleString('fr-FR')} €</span>}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-faint)' }}>
        Mis à jour le {new Date(project.updatedAt).toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}

function MenuItem({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        background: 'transparent',
        border: 'none',
        borderRadius: 6,
        color: danger ? 'var(--red)' : 'var(--text)',
        fontSize: 13,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-alt)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  )
}
