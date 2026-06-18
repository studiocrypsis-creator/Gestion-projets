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

export function createNewProject({ name, client, slug }) {
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
    script: createEmptyScript(),
    storyboard: createEmptyStoryboard(),
  }
}
