export function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function uid(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const STATUSES = [
  { value: 'storyboard', label: 'Storyboard - En cours', color: '#8ECAE6' },
  { value: 'script', label: 'Script - En cours', color: '#4AADF5' },
  { value: 'revision', label: 'En révision', color: '#1E73C7' },
  { value: 'termine', label: 'Terminé', color: '#0B3D91' },
]

export const TAG_OPTIONS = ['PRES', 'STD', 'AD', 'TEASER', 'PROMO', 'WEB']

export const VIDEO_FORMATS = [
  { value: '16:9', label: '16:9 — Paysage' },
  { value: '9:16', label: '9:16 — Vertical' },
  { value: '1:1', label: '1:1 — Carré' },
  { value: '4:5', label: '4:5 — Portrait' },
]

export function createEmptyScript() {
  return {
    introVariants: [
      { id: uid('hook'), title: 'Hook 1', content: '' },
    ],
    commonTrunk: [
      { id: uid('sec'), title: 'FRUSTRATION PROSPECT', content: '' },
      { id: uid('sec'), title: 'SOLUTION/DIFFÉRENCIATION', content: '' },
      { id: uid('sec'), title: 'PREUVE SOCIALE', content: '' },
      { id: uid('sec'), title: 'CTA', content: '' },
    ],
  }
}

export const STORYBOARD_SECTION_TITLES = [
  'Hook',
  'Énoncé du problème',
  'Solution/Différenciation',
  'Preuve sociale',
  'CTA',
]

export function createEmptyStoryboard() {
  return {
    sections: [
      {
        id: uid('sb-sec'),
        title: 'Hook',
        collapsed: false,
        plans: [],
      },
    ],
  }
}

export function createNewProject({ name, client, slug, startDate = '', dueDate = '', price = '' }) {
  const now = new Date().toISOString()
  return {
    id: uid('proj'),
    name,
    client,
    slug,
    status: 'storyboard',
    tags: ['PRES'],
    archived: false,
    videoFormat: '16:9',
    activeView: 'script',
    createdAt: now,
    updatedAt: now,
    startDate: startDate || null,
    dueDate: dueDate || null,
    price: price === '' ? null : Number(price),
    videoUrl: null,
    script: createEmptyScript(),
    storyboard: createEmptyStoryboard(),
  }
}

export function getScheduleStatus(project) {
  if (!project.dueDate || project.status === 'termine') return null
  const due = new Date(project.dueDate)
  const start = new Date(project.startDate || project.createdAt)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const redThreshold = new Date(due)
  redThreshold.setDate(redThreshold.getDate() - 3)
  if (today >= redThreshold) return 'late'

  const yellowThreshold = new Date(start)
  yellowThreshold.setDate(yellowThreshold.getDate() + 14)
  if (today >= yellowThreshold) return 'slight-delay'

  return 'on-time'
}

export const SCHEDULE_STATUS_INFO = {
  'on-time': { color: '#3ddc84', label: 'Dans les temps' },
  'slight-delay': { color: '#f5a623', label: '14 jours écoulés' },
  late: { color: '#e5484d', label: 'Échéance proche' },
}

export function getScheduleLabel(project, status) {
  if (status === 'late') {
    const due = new Date(project.dueDate)
    const today = new Date()
    due.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    return today > due ? 'En retard' : 'Échéance proche'
  }
  return SCHEDULE_STATUS_INFO[status]?.label
}
