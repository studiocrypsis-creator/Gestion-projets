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

function NavItem({ active, label, count, onClick, muted }) {
  return (
    <button
      type="button"
      className={`client-sidebar-link${active ? ' active' : ''}`}
      onClick={onClick}
      style={muted && !active ? { color: 'var(--text-faint)' } : undefined}
    >
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
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="client-sidebar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingLeft: 4 }}>
            Mes projets
          </div>
          <NavItem
            active={activeGroup === 'attente1'}
            label="Projets en attente de règlement n°1"
            count={countFor('attente1')}
            onClick={() => onSelectGroup(activeGroup === 'attente1' ? 'all' : 'attente1')}
          />
          <NavItem
            active={activeGroup === 'encours'}
            label="Projets en cours"
            count={countFor('encours')}
            onClick={() => onSelectGroup(activeGroup === 'encours' ? 'all' : 'encours')}
          />
          <NavItem
            active={activeGroup === 'attente2'}
            label="Projets en attente de règlement n°2"
            count={countFor('attente2')}
            onClick={() => onSelectGroup(activeGroup === 'attente2' ? 'all' : 'attente2')}
          />
          <NavItem
            active={activeGroup === 'termine'}
            label="Projets terminés"
            count={countFor('termine')}
            muted
            onClick={() => onSelectGroup(activeGroup === 'termine' ? 'all' : 'termine')}
          />
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, paddingLeft: 4 }}>
            CA
          </div>
          <div style={{ padding: '8px 4px', marginBottom: 4 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
              CA mensuel ({now.toLocaleDateString('fr-FR', { month: 'long' })})
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
              {formatEUR(monthlyRevenue)}
            </div>
          </div>
          <div style={{ padding: '8px 4px' }}>
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
