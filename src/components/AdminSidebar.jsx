import { Folder, TrendingUp } from 'lucide-react'
import { STATUS_GROUPS } from '../utils/storage.js'

function isThisMonth(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function isThisYear(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr).getFullYear() === new Date().getFullYear()
}

function formatEUR(value) {
  return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}

const GROUP_DOT_COLOR = {
  attente1: 'var(--amber)',
  encours: 'var(--accent)',
  attente2: 'var(--amber)',
  termine: 'var(--green)',
}

function NavItem({ active, label, count, onClick, muted, groupKey }) {
  return (
    <button
      type="button"
      className={`client-sidebar-link${active ? ' active' : ''}`}
      onClick={onClick}
      style={muted && !active ? { color: 'var(--text-faint)' } : undefined}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: GROUP_DOT_COLOR[groupKey],
          boxShadow: `0 0 6px ${GROUP_DOT_COLOR[groupKey]}`,
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{label}</span>
      <span style={{ fontSize: 11, opacity: 0.8, flexShrink: 0 }}>({count})</span>
    </button>
  )
}

export default function AdminSidebar({ projects, allProjects, activeGroup, onSelectGroup, className }) {
  const countFor = (key) =>
    projects.filter((p) => STATUS_GROUPS[key].statuses.includes(p.status)).length

  const now = new Date()
  const monthlyRevenue = allProjects
    .filter((p) => p.price != null && isThisMonth(p.dueDate || p.createdAt))
    .reduce((sum, p) => sum + Number(p.price || 0), 0)
  const yearlyRevenue = allProjects
    .filter((p) => p.price != null && isThisYear(p.dueDate || p.createdAt))
    .reduce((sum, p) => sum + Number(p.price || 0), 0)

  return (
    <div
      className={className}
      style={{
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="client-sidebar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-faint)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            <Folder size={12} />
            Mes projets
          </div>
          <NavItem
            groupKey="attente1"
            active={activeGroup === 'attente1'}
            label="Projet en attente de l'acompte"
            count={countFor('attente1')}
            onClick={() => onSelectGroup(activeGroup === 'attente1' ? 'all' : 'attente1')}
          />
          <NavItem
            groupKey="encours"
            active={activeGroup === 'encours'}
            label="Projets en cours"
            count={countFor('encours')}
            onClick={() => onSelectGroup(activeGroup === 'encours' ? 'all' : 'encours')}
          />
          <NavItem
            groupKey="attente2"
            active={activeGroup === 'attente2'}
            label="Projets en attente de règlement n°2"
            count={countFor('attente2')}
            onClick={() => onSelectGroup(activeGroup === 'attente2' ? 'all' : 'attente2')}
          />
          <NavItem
            groupKey="termine"
            active={activeGroup === 'termine'}
            label="Projets terminés"
            count={countFor('termine')}
            muted
            onClick={() => onSelectGroup(activeGroup === 'termine' ? 'all' : 'termine')}
          />
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-faint)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            <TrendingUp size={12} />
            Chiffre d'affaires
          </div>
          <div className="card" style={{ padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
              CA mensuel ({now.toLocaleDateString('fr-FR', { month: 'long' })})
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
              {formatEUR(monthlyRevenue)}
            </div>
          </div>
          <div className="card" style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
              CA annuel ({now.getFullYear()})
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
              {formatEUR(yearlyRevenue)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
