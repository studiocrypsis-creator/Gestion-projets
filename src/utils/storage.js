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
  { value: 'storyboard', label: 'Storyboard - En cours', color: '#4AADF5' },
  { value: 'script', label: 'Script - En cours', color: '#2196f3' },
  { value: 'revision', label: 'En révision', color: '#f5a623' },
  { value: 'termine', label: 'Terminé', color: '#3ddc84' },
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
      { id: uid('sec'), title: 'SOLUTION', content: '' },
      { id: uid('sec'), title: 'DIFFÉRENCIATION', content: '' },
      { id: uid('sec'), title: 'CTA', content: '' },
    ],
  }
}

export const STORYBOARD_SECTION_TITLES = [
  'Hook',
  'Énoncé du problème',
  'Solution',
  'Preuve sociale',
  'Différenciation',
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
    tags: [],
    archived: false,
    videoFormat: '16:9',
    activeView: 'script',
    createdAt: now,
    updatedAt: now,
    startDate: startDate || null,
    dueDate: dueDate || null,
    price: price === '' ? null : Number(price),
    script: createEmptyScript(),
    storyboard: createEmptyStoryboard(),
  }
}

export function getScheduleStatus(project) {
  if (!project.dueDate || project.status === 'termine') return null
  const due = new Date(project.dueDate)
  const today = new Date()
  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((today - due) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'on-time'
  if (diffDays <= 3) return 'slight-delay'
  return 'late'
}

export const SCHEDULE_STATUS_INFO = {
  'on-time': { color: '#3ddc84', label: 'Dans les temps' },
  'slight-delay': { color: '#f5a623', label: 'Léger retard' },
  late: { color: '#e5484d', label: 'En retard' },
}
