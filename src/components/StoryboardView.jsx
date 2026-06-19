import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { uid, STORYBOARD_SECTION_TITLES } from '../utils/storage.js'
import PlanCard from './PlanCard.jsx'
import CommentBubble from './CommentBubble.jsx'
import PlanViewer from './PlanViewer.jsx'

function createPlan() {
  return { id: uid('plan'), voiceover: '', image: null, description: '' }
}

export default function StoryboardView({ storyboard, onChange, onComment, readOnly = false, highlightedIds }) {
  const [addingSection, setAddingSection] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const flatPlans = storyboard.sections.flatMap((s) => s.plans)

  function updateSection(id, patch) {
    onChange({
      ...storyboard,
      sections: storyboard.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })
  }

  function removeSection(id) {
    onChange({ ...storyboard, sections: storyboard.sections.filter((s) => s.id !== id) })
  }

  function addPlan(sectionId) {
    updateSection(sectionId, {
      plans: [
        ...storyboard.sections.find((s) => s.id === sectionId).plans,
        createPlan(),
      ],
    })
  }

  function updatePlan(sectionId, planId, patch) {
    const section = storyboard.sections.find((s) => s.id === sectionId)
    updateSection(sectionId, {
      plans: section.plans.map((p) => (p.id === planId ? patch : p)),
    })
  }

  function removePlan(sectionId, planId) {
    const section = storyboard.sections.find((s) => s.id === sectionId)
    updateSection(sectionId, { plans: section.plans.filter((p) => p.id !== planId) })
  }

  function handleDragEnd(sectionId, event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const section = storyboard.sections.find((s) => s.id === sectionId)
    const oldIndex = section.plans.findIndex((p) => p.id === active.id)
    const newIndex = section.plans.findIndex((p) => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    updateSection(sectionId, { plans: arrayMove(section.plans, oldIndex, newIndex) })
  }

  function addSection(title) {
    onChange({
      ...storyboard,
      sections: [...storyboard.sections, { id: uid('sb-sec'), title, collapsed: false, plans: [] }],
    })
    setAddingSection(false)
  }

  return (
    <div style={{ padding: '32px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
      {storyboard.sections.map((section) => (
        <div key={section.id} className="card" style={{ marginBottom: 24, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: section.collapsed ? 0 : 18 }}>
            <button
              onClick={() => updateSection(section.id, { collapsed: !section.collapsed })}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: 16,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>
                {section.collapsed ? '▶' : '▼'}
              </span>
              {section.title}
            </button>
            {!readOnly && (
              <div style={{ display: 'flex', gap: 2 }}>
                <button className="btn-icon" title="Commentaire">
                  💬
                </button>
                <button className="btn-icon danger" title="Supprimer la section" onClick={() => removeSection(section.id)}>
                  ✕
                </button>
              </div>
            )}
          </div>

          {!section.collapsed && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(section.id, e)}
            >
              <SortableContext items={section.plans.map((p) => p.id)} strategy={rectSortingStrategy}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 16,
                  }}
                >
                  {section.plans.map((plan, i) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      index={i}
                      onChange={(patch) => updatePlan(section.id, plan.id, patch)}
                      onRemove={() => removePlan(section.id, plan.id)}
                      onComment={
                        onComment &&
                        ((message) =>
                          onComment(
                            { type: 'storyboard_plan', id: plan.id, label: `Section "${section.title}" — Plan ${i + 1}` },
                            message
                          ))
                      }
                      readOnly={readOnly}
                      highlighted={highlightedIds?.has(plan.id)}
                      onOpen={
                        readOnly ? () => setViewerIndex(flatPlans.findIndex((p) => p.id === plan.id)) : undefined
                      }
                    />
                  ))}
                  {!readOnly && (
                    <button
                      onClick={() => addPlan(section.id)}
                      className="btn btn-ghost"
                      style={{
                        minHeight: 160,
                        justifyContent: 'center',
                        borderStyle: 'dashed',
                      }}
                    >
                      + Ajouter un plan
                    </button>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      ))}

      {!readOnly && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {addingSection ? (
            <div
              className="card"
              style={{ display: 'inline-flex', gap: 6, padding: 8, flexWrap: 'wrap', justifyContent: 'center' }}
            >
              {STORYBOARD_SECTION_TITLES.map((title) => (
                <button key={title} className="btn btn-ghost" onClick={() => addSection(title)}>
                  {title}
                </button>
              ))}
              <button className="btn-icon" onClick={() => setAddingSection(false)}>
                ✕
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => setAddingSection(true)}>
              Ajouter une section
            </button>
          )}
        </div>
      )}

      {viewerIndex !== null && (
        <PlanViewer
          plans={flatPlans}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
