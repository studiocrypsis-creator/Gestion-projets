// Renders a @react-pdf/renderer <Document> element to a blob and triggers a
// browser download — same client-side, no-backend approach as the rest of
// this app (no server route involved, nothing to deploy or secure).
// @react-pdf/renderer pulls in a wasm layout engine + font subsetter (~1.5MB)
// that almost no page view needs, so it's imported dynamically here instead
// of at the top of the module — only the click that actually exports a PDF
// pays for fetching it, not every visit to the Script/Storyboard tab.
export async function downloadPdf(documentElement, filename) {
  const { pdf } = await import('@react-pdf/renderer')
  const blob = await pdf(documentElement).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Forces a same-tab download of a same-origin/CORS-open file (Supabase
// Storage public URLs already send Access-Control-Allow-Origin: *) instead of
// navigating to it — fetching as a blob first means the browser always saves
// the file with its real name instead of possibly just opening/playing it.
export async function downloadFile(url, filename) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
}
