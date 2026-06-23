import { useRef, useState } from 'react'
import {
  Upload,
  FileText,
  Eye,
  Trash2,
  Gift,
  Link2,
  Copy,
  Star,
  ClipboardList,
  Receipt,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { uploadClientDocument, deleteClientDocument } from '../utils/storageBucket.js'

// Update these two whenever the links change — nothing else in the file needs to be touched.
const GOOGLE_REVIEW_URL = 'https://share.google/7ApQ6QGLPiEoPDqRh'
const WHATSAPP_NUMBER = '33646319704' // digits only, international format, no "+" — used as https://wa.me/<number>

/**
 * @typedef {Object} ClientSidebarProject
 * @property {string} id
 * @property {string} name
 * @property {string} clientName
 * @property {string} [promoCodeName]
 * @property {string} [promoCodeValue]
 * @property {string} [affiliationCode]
 * @property {Object} [clientDocuments] - { discoveryRecap, tallyForm, devis: {name,url,path}, invoices: [{id,name,url,path}] }
 */

function isPdf(file) {
  return file && (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))
}

// Supabase Storage's public object endpoint doesn't send a Content-Disposition
// header at all. Chrome/Safari/Edge default missing-disposition + application/pdf
// to inline rendering, but Firefox doesn't reliably do the same and can force a
// download instead. Fetching the file ourselves and opening it as a blob: URL
// sidesteps that header entirely — same outcome (inline, browser-native viewer)
// in every browser, since the browser fully owns the blob: response.
// The tab is opened synchronously (before the await) so it isn't blocked as a
// popup; we can't use `noopener` here because that makes window.open() return
// null, leaving nothing to navigate once the blob is ready — acceptable since
// the tab only ever navigates to our own blob: URL or our own Supabase domain.
function openPdfInline(url) {
  const tab = window.open('', '_blank')
  if (tab) {
    tab.document.write(
      '<title>Ouverture du document…</title><body style="background:#0d0f14;color:#8b949e;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">Ouverture du document…</body>'
    )
  }
  fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob)
      if (tab) tab.location.href = blobUrl
      else window.open(blobUrl, '_blank', 'noopener')
    })
    .catch(() => {
      // Network/CORS hiccup — fall back to letting the browser handle the
      // original URL directly, same as before this fix.
      if (tab) tab.location.href = url
      else window.open(url, '_blank', 'noopener')
    })
}

function CategoryLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--text-faint)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 8,
        paddingLeft: 4,
      }}
    >
      {children}
    </div>
  )
}

function ItemLabel({ icon: Icon, children, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
      <Icon size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>{children}</span>
      {done ? (
        <CheckCircle2 size={14} title="Document ajouté" style={{ color: 'var(--green)', flexShrink: 0 }} />
      ) : (
        <AlertCircle size={14} title="En attente" style={{ color: 'var(--amber)', flexShrink: 0 }} />
      )}
    </div>
  )
}

function FileRow({ name, url, onDelete, deleting }) {
  return (
    <div className="client-file-row">
      <FileText size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <button type="button" className="btn-icon" title="Ouvrir" onClick={() => openPdfInline(url)}>
        <Eye size={14} />
      </button>
      {onDelete && (
        <button type="button" className="btn-icon danger" title="Supprimer" onClick={onDelete} disabled={deleting}>
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

// Single-file upload slot: drop zone, or the uploaded file with open/delete actions.
function UploadSlot({ doc, onUpload, onRemove, readOnly }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(fileList) {
    const picked = fileList?.[0]
    if (!isPdf(picked)) return
    setError('')
    setBusy(true)
    try {
      await onUpload(picked)
    } catch (err) {
      setError(err.message || "Échec de l'envoi")
    } finally {
      setBusy(false)
    }
  }

  if (doc) {
    return (
      <FileRow
        name={doc.name}
        url={doc.url}
        deleting={busy}
        onDelete={
          readOnly
            ? undefined
            : async () => {
                setBusy(true)
                try {
                  await onRemove()
                } catch (err) {
                  setError(err.message || 'Échec de la suppression')
                  setBusy(false)
                }
              }
        }
      />
    )
  }

  if (readOnly) {
    return <div style={{ fontSize: 12, color: 'var(--text-faint)', paddingLeft: 4 }}>Pas encore disponible</div>
  }

  return (
    <>
      <div
        className={`client-upload-zone${dragActive ? ' drag-active' : ''}`}
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <Upload size={14} style={{ flexShrink: 0 }} />
        <span>{busy ? 'Envoi en cours...' : 'Déposer un PDF'}</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{error}</div>}
    </>
  )
}

// Multi-file upload: an always-visible drop zone (to add more, unless read-only) plus the file list.
function UploadList({ files, onAdd, onRemove, readOnly }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleFiles(fileList) {
    const picked = Array.from(fileList || []).filter(isPdf)
    if (picked.length === 0) return
    setError('')
    setBusy(true)
    try {
      for (const f of picked) {
        await onAdd(f)
      }
    } catch (err) {
      setError(err.message || "Échec de l'envoi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map((f) => (
        <FileRow
          key={f.id}
          name={f.name}
          url={f.url}
          onDelete={readOnly ? undefined : () => onRemove(f)}
        />
      ))}

      {files.length === 0 && readOnly && (
        <div style={{ fontSize: 12, color: 'var(--text-faint)', paddingLeft: 4 }}>Pas encore disponible</div>
      )}

      {!readOnly && (
        <>
          <div
            className={`client-upload-zone${dragActive ? ' drag-active' : ''}`}
            onClick={() => !busy && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              handleFiles(e.dataTransfer.files)
            }}
          >
            <Upload size={14} style={{ flexShrink: 0 }} />
            <span>{busy ? 'Envoi en cours...' : 'Déposer un PDF'}</span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{error}</div>}
        </>
      )}
    </div>
  )
}

function CopyableCode({ value }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4 }}>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontFamily: 'monospace',
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
      <span className="client-copy-btn">
        <button type="button" className="btn-icon" title="Copier" onClick={handleCopy}>
          <Copy size={14} />
        </button>
        {copied && <span className="client-copy-tooltip">Copié !</span>}
      </span>
    </div>
  )
}

/**
 * @param {{ project: ClientSidebarProject, onUpdateProject: (patch: object) => void, readOnly?: boolean, className?: string }} props
 */
export default function ClientSidebar({ project, onUpdateProject, readOnly = false, className = '', onMobileClose }) {
  const docs = project.clientDocuments || {}
  const invoices = docs.invoices || []

  async function uploadSingle(slotKey, file) {
    const uploaded = await uploadClientDocument(project.id, slotKey, file)
    onUpdateProject({ clientDocuments: { ...docs, [slotKey]: uploaded } })
  }

  async function removeSingle(slotKey) {
    const current = docs[slotKey]
    if (current?.path) await deleteClientDocument(current.path)
    const next = { ...docs }
    delete next[slotKey]
    onUpdateProject({ clientDocuments: next })
  }

  async function addInvoice(file) {
    const uploaded = await uploadClientDocument(project.id, 'invoices', file)
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    onUpdateProject({ clientDocuments: { ...docs, invoices: [...invoices, { id, ...uploaded }] } })
  }

  async function removeInvoice(invoice) {
    if (invoice.path) await deleteClientDocument(invoice.path)
    onUpdateProject({
      clientDocuments: { ...docs, invoices: invoices.filter((f) => f.id !== invoice.id) },
    })
  }

  return (
    <div
      className={className}
      style={{
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflowWrap: 'anywhere' }}>
            {project.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{project.clientName}</div>
        </div>
        {onMobileClose && (
          <button
            type="button"
            className="btn-icon sidebar-toggle-mobile"
            onClick={onMobileClose}
            title="Masquer"
            style={{ flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="client-sidebar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <CategoryLabel>Brief de départ</CategoryLabel>
          <div style={{ marginBottom: 14 }}>
            <ItemLabel icon={ClipboardList} done={Boolean(docs.discoveryRecap)}>
              Récapitulatif rendez-vous de découverte
            </ItemLabel>
            <UploadSlot
              doc={docs.discoveryRecap}
              readOnly={readOnly}
              onUpload={(f) => uploadSingle('discoveryRecap', f)}
              onRemove={() => removeSingle('discoveryRecap')}
            />
          </div>
          <div>
            <ItemLabel icon={FileText} done={Boolean(docs.tallyForm)}>
              Réponse au formulaire Tally
            </ItemLabel>
            <UploadSlot
              doc={docs.tallyForm}
              readOnly={readOnly}
              onUpload={(f) => uploadSingle('tallyForm', f)}
              onRemove={() => removeSingle('tallyForm')}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <CategoryLabel>Documents administratifs</CategoryLabel>
          <div style={{ marginBottom: 14 }}>
            <ItemLabel icon={FileText} done={Boolean(docs.devis)}>
              Devis
            </ItemLabel>
            <UploadSlot
              doc={docs.devis}
              readOnly={readOnly}
              onUpload={(f) => uploadSingle('devis', f)}
              onRemove={() => removeSingle('devis')}
            />
          </div>
          <div>
            <ItemLabel icon={Receipt} done={invoices.length > 0}>
              Factures
            </ItemLabel>
            <UploadList files={invoices} readOnly={readOnly} onAdd={addInvoice} onRemove={removeInvoice} />
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <CategoryLabel>Code promo & affiliation</CategoryLabel>
          {project.promoCodeName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 }}>
              <Gift size={14} style={{ flexShrink: 0, color: '#d6b4ff' }} />
              <span className="promo-glow" style={{ flex: 1, minWidth: 0, fontSize: 13, overflowWrap: 'anywhere' }}>
                {project.promoCodeName}
              </span>
              <span className="badge" style={{ background: 'var(--card-alt)', color: 'var(--text-dim)', flexShrink: 0 }}>
                {project.promoCodeValue || 'x1'}
              </span>
            </div>
          )}
          {project.affiliationCode && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                <Link2 size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
                  Code d'affiliation client
                </span>
              </div>
              <CopyableCode value={project.affiliationCode} />
            </>
          )}
          {!project.promoCodeName && !project.affiliationCode && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)', paddingLeft: 4 }}>Aucun code pour ce projet</div>
          )}
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <CategoryLabel>Expérience</CategoryLabel>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="client-sidebar-link"
            style={{ textDecoration: 'none' }}
          >
            <Star size={15} style={{ color: '#f5c518', flexShrink: 0 }} />
            Laisser un avis Google
          </a>
        </div>
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="whatsapp-btn"
          onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank', 'noopener')}
        >
          <FaWhatsapp size={16} />
          Une question ? Écrivez-nous
        </button>
      </div>
    </div>
  )
}
