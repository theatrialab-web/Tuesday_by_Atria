import { useMemo, useState } from 'react'
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors,
  useDroppable, useDraggable, DragOverlay, closestCorners,
} from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { OptionPill, Avatar } from './ui'
import { formatDate, colOptions } from '../lib/constants'

function KanbanCard({ task, values, columns, members, onOpenTask, dragging = false }) {
  const dateCol = columns.find(c => c.type === 'date')
  const personCol = columns.find(c => c.type === 'person')
  const prioCol = columns.find(c => c.type === 'priority')
  const v = values[task.id] || {}
  const prio = prioCol ? colOptions(prioCol).find(o => o.id === v[prioCol.id]) : null
  const assigned = personCol
    ? members.filter(m => (Array.isArray(v[personCol.id]) ? v[personCol.id] : []).includes(m.id))
    : []

  return (
    <div onClick={() => !dragging && onOpenTask(task)}
      className={`surface rounded-ios-sm border hairline p-3 ${dragging ? 'shadow-xl rotate-2' : 'cursor-grab active:cursor-grabbing'}`}>
      <p className="text-sm font-medium leading-snug mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {prio && <OptionPill option={prio} small asButton={false} />}
          {dateCol && v[dateCol.id] && (
            <span className="text-[10px] text-2">{formatDate(v[dateCol.id])}</span>
          )}
        </div>
        <div className="flex -space-x-1.5">
          {assigned.slice(0, 3).map(m => <Avatar key={m.id} profile={m} size={20} />)}
        </div>
      </div>
    </div>
  )
}

function DraggableCard(props) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: props.task.id })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      className={isDragging ? 'opacity-30' : ''} style={{ touchAction: 'none' }}>
      <KanbanCard {...props} />
    </div>
  )
}

function KanbanColumn({ option, tasks, children, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: option.id })
  const [draft, setDraft] = useState('')
  return (
    <div ref={setNodeRef}
      className={`w-[280px] sm:w-[300px] shrink-0 snap-center rounded-ios p-2.5 flex flex-col gap-2 transition-colors ${isOver ? 'bg-brand-soft dark:bg-brand-softDark' : 'surface-2'}`}>
      <div className="flex items-center gap-2 px-1.5 py-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
        <span className="text-sm font-semibold">{option.label}</span>
        <span className="text-xs text-2">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 min-h-[60px]">{children}</div>
      <div className="flex items-center gap-1.5 px-1.5 text-2">
        <Plus size={13} />
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft.trim()) {
              onAdd(draft.trim())
              setDraft('')
            }
          }}
          placeholder="Agregar"
          data-new-task
          className="flex-1 bg-transparent text-xs py-1 placeholder:text-2" />
      </div>
    </div>
  )
}

export function KanbanView({ columns, topTasks, values, members, createTask, setValue, onOpenTask }) {
  const statusCol = useMemo(() => columns.find(c => c.type === 'status'), [columns])
  const [activeId, setActiveId] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  )

  const options = colOptions(statusCol)
  const groups = useMemo(() => {
    const g = Object.fromEntries(options.map(o => [o.id, []]))
    g.__none = []
    if (!statusCol) return g
    for (const t of topTasks) {
      const raw = values[t.id]?.[statusCol.id]
      const s = Array.isArray(raw) ? raw[0] : raw
      if (s && g[s]) g[s].push(t)
      else g.__none.push(t)
    }
    return g
  }, [topTasks, values, statusCol, options])

  if (!statusCol) {
    return <p className="text-sm text-2 p-4">Este board no tiene columna de Estado, necesaria para el Kanban.</p>
  }

  const activeTask = topTasks.find(t => t.id === activeId)

  const onDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const current = values[active.id]?.[statusCol.id] ?? null
    const target = over.id === '__none' ? null : over.id
    if (current !== target) setValue(active.id, statusCol.id, target)
  }

  const allCols = [
    ...(groups.__none.length ? [{ id: '__none', label: 'Sin estado', color: '#9A9AA6' }] : []),
    ...options,
  ]

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory sm:snap-none">
        {allCols.map(opt => (
          <KanbanColumn key={opt.id} option={opt} tasks={groups[opt.id] || []}
            onAdd={(title) => createTask(title, null, opt.id === '__none' ? {} : { [statusCol.id]: opt.id })}>
            {(groups[opt.id] || []).map(t => (
              <DraggableCard key={t.id} task={t} values={values} columns={columns}
                members={members} onOpenTask={onOpenTask} />
            ))}
          </KanbanColumn>
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <KanbanCard task={activeTask} values={values} columns={columns}
            members={members} onOpenTask={() => {}} dragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}
