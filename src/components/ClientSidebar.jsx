import { useRef, useState } from 'react'
import { Upload, FileText, Eye, Trash2, ClipboardList, Receipt, Banknote, Gift, Link2, Copy, Star } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'

// TODO: replace with the real Google My Business review link
const GOOGLE_REVIEW_URL = 'https://g.page/r/YOUR_GOOGLE_ID/review'
// TODO: replace with the real WhatsApp number, international format without "+" or spaces
const WHATSAPP_NUMBER = '33600000000'

/**
 * @typedef {Object} ClientSidebarProject
 * @property {string} id
 * @property {string} name
 * @property {string} clientName
 * @property {string} promoCodeName
 * @property {string} promoCodeValue
 * @property {string} affiliationCode
 */

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function isPdf(file) {
  return file && (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf'))
}

function CategoryLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--text-faint)',
        fontWeight: 500,
        marginBottom: 8,
        paddingLeft: 4,
      }}
    >
      {children}
    </div>
  )
}

function ItemLabel({ icon, children, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>{children}</span>
      {done && (
        <span
          title="Document ajouté"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 6px 1px var(--green)',
            flexShrink: 0,
          }}
        />
      )}
    </div>
  )
}

// Single-file upload slot: shows a drop zone, or the uploaded file with open/delete actions.
function UploadSlot({ file, onUpload, onRemove }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  async function handleFiles(fileList) {
    const picked = fileList?.[0]
    if (!isPdf(picked)) return
    const dataUrl = await readFileAsDataUrl(picked)
    // NOTE: replace with an upload to real backend storage (e.g. Supabase Storage)
    // and persist the resulting URL on the project instead of keeping base64 in memory.
    onUpload({ name: picked.name, dataUrl })
  }

  if (file) {
    return (
      <div className="client-file-row">
        <FileText size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.name}
        </span>
        <button
          type="button"
          className="btn-icon"
          title="Ouvrir"
          onClick={() => window.open(file.dataUrl, '_blank', 'noopener')}
          style={{ flexShrink: 0 }}
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          className="btn-icon danger"
          title="Supprimer"
          onClick={onRemove}
          style={{ flexShrink: 0 }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`client-upload-zone${dragActive ? ' drag-active' : ''}`}
      onClick={() => inputRef.current?.click()}
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
      <span>Déposer un PDF</span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

// Multi-file upload: an always-visible drop zone (to add more) plus a list of uploaded files.
function UploadList({ files, onAdd, onRemove }) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  async function handleFiles(fileList) {
    const picked = Array.from(fileList || []).filter(isPdf)
    for (const f of picked) {
      const dataUrl = await readFileAsDataUrl(f)
      // NOTE: replace with an upload to real backend storage, same as UploadSlot above.
      onAdd({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: f.name, dataUrl })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {files.map((f) => (
        <div key={f.id} className="client-file-row">
          <FileText size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.name}
          </span>
          <button
            type="button"
            className="btn-icon"
            title="Ouvrir"
            onClick={() => window.open(f.dataUrl, '_blank', 'noopener')}
            style={{ flexShrink: 0 }}
          >
            <Eye size={14} />
          </button>
          <button
            type="button"
            className="btn-icon danger"
            title="Supprimer"
            onClick={() => onRemove(f.id)}
            style={{ flexShrink: 0 }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div
        className={`client-upload-zone${dragActive ? ' drag-active' : ''}`}
        onClick={() => inputRef.current?.click()}
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
        <span>Déposer un PDF</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
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
 * @param {{ project: ClientSidebarProject }} props
 */
export default function ClientSidebar({ project }) {
  const [files, setFiles] = useState({
    discoveryRecap: null,
    tallyForm: null,
    devis: null,
    invoices: [],
  })

  function setSlot(key, value) {
    setFiles((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: '#0f0f0f',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#e5e5e5', overflowWrap: 'anywhere' }}>
          {project.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{project.clientName}</div>
      </div>

      <div className="client-sidebar" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ marginBottom: 24 }}>
          <CategoryLabel>Brief de départ</CategoryLabel>
          <div style={{ marginBottom: 14 }}>
            <ItemLabel icon="📋" done={Boolean(files.discoveryRecap)}>
              Récapitulatif rendez-vous de découverte
            </ItemLabel>
            <UploadSlot
              file={files.discoveryRecap}
              onUpload={(f) => setSlot('discoveryRecap', f)}
              onRemove={() => setSlot('discoveryRecap', null)}
            />
          </div>
          <div>
            <ItemLabel icon="📝" done={Boolean(files.tallyForm)}>
              Réponse au formulaire Tally
            </ItemLabel>
            <UploadSlot
              file={files.tallyForm}
              onUpload={(f) => setSlot('tallyForm', f)}
              onRemove={() => setSlot('tallyForm', null)}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <CategoryLabel>Documents administratifs</CategoryLabel>
          <div style={{ marginBottom: 14 }}>
            <ItemLabel icon="🧾" done={Boolean(files.devis)}>
              Devis
            </ItemLabel>
            <UploadSlot
              file={files.devis}
              onUpload={(f) => setSlot('devis', f)}
              onRemove={() => setSlot('devis', null)}
            />
          </div>
          <div>
            <ItemLabel icon="💶" done={files.invoices.length > 0}>
              Factures
            </ItemLabel>
            <UploadList
              files={files.invoices}
              onAdd={(f) => setFiles((prev) => ({ ...prev, invoices: [...prev.invoices, f] }))}
              onRemove={(id) =>
                setFiles((prev) => ({ ...prev, invoices: prev.invoices.filter((f) => f.id !== id) }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <CategoryLabel>Code promo & affiliation</CategoryLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 }}>
            <Gift size={14} style={{ flexShrink: 0, color: '#d6b4ff' }} />
            <span className="promo-glow" style={{ flex: 1, minWidth: 0, fontSize: 13, overflowWrap: 'anywhere' }}>
              {project.promoCodeName}
            </span>
            <span className="badge" style={{ background: 'var(--card-alt)', color: 'var(--text-dim)', flexShrink: 0 }}>
              x1
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, paddingLeft: 4 }}>
            <Link2 size={14} style={{ flexShrink: 0, color: 'var(--text-faint)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-dim)', fontWeight: 500 }}>
              Code d'affiliation client
            </span>
          </div>
          <CopyableCode value={project.affiliationCode} />
        </div>

        <div style={{ paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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

      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
