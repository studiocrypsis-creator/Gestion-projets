import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { uid } from '../utils/storage.js'
import CommentBubble from './CommentBubble.jsx'
import AutoTextarea from './AutoTextarea.jsx'

export default function ScriptView({ script, onChange, onComment, readOnly = false, highlightedIds }) {
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
        <Section title="Variantes d'introduction">
          {script.introVariants.map((sub, i) => (
            <SubSection
              key={sub.id}
              label={sub.title}
              value={sub.content}
              onChange={(v) => updateIntro(sub.id, v)}
              onRemove={!readOnly && script.introVariants.length > 1 ? () => removeIntro(sub.id) : null}
              isLast={i === script.introVariants.length - 1}
              readOnly={readOnly}
              highlighted={highlightedIds?.has(sub.id)}
              onComment={
                onComment &&
                ((message) => onComment({ type: 'script_section', id: sub.id, label: `Intro "${sub.title}"` }, message))
              }
            />
          ))}
          {!readOnly && <AddButton onClick={addIntro} label="+ Ajouter un hook" />}
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
                  onComment={
                    onComment &&
                    ((message) => onComment({ type: 'script_section', id: sub.id, label: `Section "${sub.title}"` }, message))
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
          {!readOnly && <AddButton onClick={addTrunkSection} label="+ Ajouter une sous-section" />}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card" style={{ padding: 32, marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>{title}</h2>
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
    <div ref={setNodeRef} style={style}>
      <SubSection
        {...props}
        readOnly={readOnly}
        dragHandle={
          !readOnly && (
            <span
              {...attributes}
              {...listeners}
              style={{ cursor: 'grab', color: 'var(--text-faint)', fontSize: 16, marginRight: 8 }}
              title="Déplacer"
            >
              ⠿
            </span>
          )
        }
      />
    </div>
  )
}

function SubSection({
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
}) {
  return (
    <div
      style={{
        paddingBottom: 20,
        marginBottom: 20,
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        borderRadius: highlighted ? 8 : 0,
        boxShadow: highlighted ? '0 0 0 1px var(--accent), 0 0 12px 2px var(--accent)' : 'none',
        padding: highlighted ? 12 : 0,
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
              minWidth: 160,
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
            ✕
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
      {label}
    </button>
  )
}
