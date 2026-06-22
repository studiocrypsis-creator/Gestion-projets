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
  { value: 'attente_premier_reglement', label: 'Attente premier règlement', color: '#F06595' },
  { value: 'script_cours', label: 'Script en cours', color: '#FFD43B' },
  { value: 'script_revision', label: 'Script en révision', color: '#E0B000' },
  { value: 'storyboard_cours', label: 'Storyboard en cours', color: '#B388FF' },
  { value: 'storyboard_revision', label: 'Storyboard en révision', color: '#7C4DFF' },
  { value: 'animation_cours', label: 'Animation en cours', color: '#69DB7C' },
  { value: 'animation_revision', label: 'Animation en révision', color: '#2F9E44' },
  { value: 'attente_paiement', label: 'Validé - en attente de règlement', color: '#FF922B' },
  { value: 'termine', label: 'Terminé', color: '#15AABF' },
]

export const TAG_OPTIONS = ['PRES', 'STD', 'AD', 'TEASER', 'PROMO', 'WEB']

// Sidebar status groups for the admin dashboard nav.
export const STATUS_GROUPS = {
  attente1: {
    label: 'Projets en attente de règlement n°1',
    statuses: ['attente_premier_reglement'],
  },
  encours: {
    label: 'Projets en cours',
    statuses: [
      'script_cours',
      'script_revision',
      'storyboard_cours',
      'storyboard_revision',
      'animation_cours',
      'animation_revision',
    ],
  },
  attente2: {
    label: 'Projets en attente de règlement n°2',
    statuses: ['attente_paiement'],
  },
  termine: {
    label: 'Projets terminés',
    statuses: ['termine'],
  },
}

export const VIDEO_FORMATS = [
  { value: '16:9', label: '16:9 — Paysage' },
  { value: '9:16', label: '9:16 — Vertical' },
  { value: '1:1', label: '1:1 — Carré' },
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

export function createNewProject({
  name,
  client,
  slug,
  startDate = '',
  dueDate = '',
  price = '',
  promoCodeName = '',
  promoCodeValue = '',
  affiliationCode = '',
}) {
  const now = new Date().toISOString()
  return {
    id: uid('proj'),
    name,
    client,
    slug,
    status: 'script_cours',
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
    promoCodeName: promoCodeName || null,
    promoCodeValue: promoCodeValue || null,
    affiliationCode: affiliationCode || null,
    clientDocuments: {},
  }
}

export function getDefaultView(status) {
  if (status === 'attente_premier_reglement') return 'script'
  if (status === 'script_cours' || status === 'script_revision') return 'script'
  if (status === 'storyboard_cours' || status === 'storyboard_revision') return 'storyboard'
  return 'video'
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
