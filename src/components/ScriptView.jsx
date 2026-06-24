import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FileText, Music, PlusCircle, GripVertical, X, Download, Loader2 } from 'lucide-react'
import { uid } from '../utils/storage.js'
import { uploadScriptAudio, deleteScriptAudio } from '../utils/storageBucket.js'
import { downloadPdf } from '../utils/pdfExport.js'
import CommentBubble from './CommentBubble.jsx'
import AutoTextarea from './AutoTextarea.jsx'
import AudioPlayer from './AudioPlayer.jsx'

export default function ScriptView({
  script,
  onChange,
  onComment,
  readOnly = false,
  highlightedIds,
  flashId,
  projectId,
  projectName,
}) {
  const [audioRemoveError, setAudioRemoveError] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState('')

  async function handleExportPdf() {
    setExportError('')
    setExportingPdf(true)
    try {
      const { default: ScriptPdf } = await import('../pdf/ScriptPdf.jsx')
      await downloadPdf(
        <ScriptPdf projectName={projectName} script={script} />,
        `${projectName} - Script.pdf`
      )
    } catch (err) {
      setExportError(err.message || "Échec de l'export PDF")
    } finally {
      setExportingPdf(false)
    }
  }

  // Upload errors are surfaced by AudioPlayer itself (it owns the upload UI);
  // re-throwing lets it catch and display them instead of swallowing them here.
  async function handleAudioUpload(file) {
    const uploaded = await uploadScriptAudio(projectId, file)
    onChange({ ...script, audio: uploaded })
  }

  async function handleAudioRemove() {
    const current = script.audio
    setAudioRemoveError('')
    onChange({ ...script, audio: null })
    if (current?.path) {
      try {
        await deleteScriptAudio(current.path)
      } catch (err) {
        setAudioRemoveError(err.message || 'Échec de la suppression du fichier audio')
      }
    }
  }

  function updateIntro(id, content) {
    onChange({
      ...script,
      introVariants: script.introVariants.map((s) => (s.id === id ? { ...s, content } : s)),
    })
  }

  function updateTrunk(id, content) {
    onChange({
      ...script,
      commonTrunk: script.commonTrunk.map((s) => (s.id === id ? { ...s, content } : s)),
    })
  }

  function addIntro() {
    const n = script.introVariants.length + 1
    onChange({
      ...script,
      introVariants: [...script.introVariants, { id: uid('hook'), title: `Hook ${n}`, content: '' }],
    })
  }

  function removeIntro(id) {
    if (script.introVariants.length <= 1) return
    onChange({ ...script, introVariants: script.introVariants.filter((s) => s.id !== id) })
  }

  function addTrunkSection() {
    onChange({
      ...script,
      commonTrunk: [
        ...script.commonTrunk,
        { id: uid('sec'), title: 'NOUVELLE SECTION', content: '' },
      ],
    })
  }

  function renameTrunk(id, title) {
    onChange({
      ...script,
      commonTrunk: script.commonTrunk.map((s) => (s.id === id ? { ...s, title } : s)),
    })
  }

  function removeTrunk(id) {
    onChange({ ...script, commonTrunk: script.commonTrunk.filter((s) => s.id !== id) })
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleTrunkDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = script.commonTrunk.findIndex((s) => s.id === active.id)
    const newIndex = script.commonTrunk.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...script, commonTrunk: arrayMove(script.commonTrunk, oldIndex, newIndex) })
  }

  return (
    <div style={{ background: 'var(--bg-header)', minHeight: 'calc(100vh - 65px)', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button type="button" className="btn btn-ghost" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 size={15} className="icon-spin" /> : <Download size={15} />}
            {exportingPdf ? 'Génération...' : 'Télécharger en PDF'}
          </button>
        </div>
        {exportError && (
          <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 16, textAlign: 'right' }}>{exportError}</div>
        )}

        <Section title="Audio" icon={Music}>
          <AudioPlayer
            audio={script.audio}
            onUpload={!readOnly ? handleAudioUpload : undefined}
            onRemove={!readOnly ? handleAudioRemove : undefined}
            readOnly={readOnly}
          />
          {audioRemoveError && (
            <div style={{ color: 'var(--red)', fontSize: 11, marginTop: 8 }}>{audioRemoveError}</div>
          )}
        </Section>

        <Section title="Variantes d'introduction">
          {script.introVariants.map((sub, i) => (
            <SubSection
              key={sub.id}
              id={`fb-target-${sub.id}`}
              label={sub.title}
              value={sub.content}
              onChange={(v) => updateIntro(sub.id, v)}
              onRemove={!readOnly && script.introVariants.length > 1 ? () => removeIntro(sub.id) : null}
              isLast={i === script.introVariants.length - 1}
              readOnly={readOnly}
              highlighted={highlightedIds?.has(sub.id)}
              flashing={flashId === sub.id}
              onComment={
                onComment &&
                ((message) => onComment({ type: 'script_section', id: sub.id, label: `Intro "${sub.title}"` }, message))
              }
            />
          ))}
          {!readOnly && <AddButton onClick={addIntro} label="Ajouter un hook" />}
        </Section>

        <Section title="Tronc commun">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTrunkDragEnd}>
            <SortableContext items={script.commonTrunk.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {script.commonTrunk.map((sub, i) => (
                <SortableSubSection
                  key={sub.id}
                  id={sub.id}
                  label={sub.title}
                  editableLabel={!readOnly}
                  onLabelChange={(v) => renameTrunk(sub.id, v)}
                  value={sub.content}
                  onChange={(v) => updateTrunk(sub.id, v)}
                  onRemove={!readOnly ? () => removeTrunk(sub.id) : null}
                  isLast={i === script.commonTrunk.length - 1}
                  readOnly={readOnly}
                  highlighted={highlightedIds?.has(sub.id)}
                  flashing={flashId === sub.id}
                  onComment={
                    onComment &&
                    ((message) => onComment({ type: 'script_section', id: sub.id, label: `Section "${sub.title}"` }, message))
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
          {!readOnly && <AddButton onClick={addTrunkSection} label="Ajouter une sous-section" />}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, icon: Icon = FileText, children }) {
  return (
    <div className="card fade-in-up" style={{ padding: 32, marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon size={18} style={{ color: 'var(--accent)' }} />
        {title}
      </h2>
      {children}
    </div>
  )
}

function SortableSubSection({ id, readOnly, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div ref={setNodeRef} id={`fb-target-${id}`} style={style}>
      <SubSection
        {...props}
        readOnly={readOnly}
        dragHandle={
          !readOnly && (
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', color: 'var(--text-faint)', display: 'inline-flex', marginRight: 4 }}
              title="Déplacer"
            >
              <GripVertical size={15} />
            </span>
          )
        }
      />
    </div>
  )
}

function SubSection({
  id,
  label,
  value,
  onChange,
  onRemove,
  isLast,
  editableLabel,
  onLabelChange,
  readOnly,
  onComment,
  dragHandle,
  highlighted,
  flashing,
}) {
  return (
    <div
      id={id}
      className={flashing ? 'feedback-flash' : undefined}
      style={{
        paddingBottom: 20,
        marginBottom: 20,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        borderRadius: highlighted || flashing ? 8 : 0,
        boxShadow: highlighted ? '0 0 0 1px var(--accent), 0 0 12px 2px var(--accent)' : 'none',
        padding: highlighted || flashing ? 12 : 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          {dragHandle}
        {editableLabel ? (
          <input
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              padding: 0,
              width: '60%',
              minWidth: 0,
              maxWidth: '100%',
            }}
          />
        ) : (
          <span
            style={{
              color: 'var(--text-dim)',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </span>
        )}
        </div>
        {readOnly ? onComment && <CommentBubble onSubmit={onComment} /> : onRemove && (
          <button className="btn-icon" onClick={onRemove} title="Supprimer">
            <X size={15} />
          </button>
        )}
      </div>
      <AutoTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        placeholder="Écrire ici..."
        rows={4}
        style={{
          width: '100%',
          padding: 12,
          background: 'var(--card-alt)',
          fontSize: 14,
          lineHeight: 1.5,
        }}
      />
    </div>
  )
}

function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="btn btn-ghost"
      style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}
    >
      <PlusCircle size={15} /> {label}
    </button>
  )
}
