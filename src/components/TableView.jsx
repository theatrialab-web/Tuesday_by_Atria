import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronRight, Plus, Trash2, Settings2, Pencil, Check, Maximize2, CornerDownRight } from 'lucide-react'
import { OptionPill, OptionSheet, Checkbox } from './ui'
import { PersonCell, DateCell, TagCell } from './cells'
import { formatDate, colOptions, colMulti } from '../lib/constants'

function findOption(column, value) {
  return colOptions(column).find(o => o.id === value) || null
}

// Título editable inline: clic abre la tarea, lápiz (hover) o doble clic edita.
function TitleCell({ task, onSave, onOpen }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  if (editing) {
    return (
      <input autoFocus value={draft}
        onClick={e => e.stopPropagation()}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); const t = draft.trim(); if (t && t !== task.title) onSave(t); else setDraft(task.title) }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.target.blur()
          if (e.key === 'Escape') { setDraft(task.title); setEditing(false) }
        }}
        className="font-medium bg-transparent border-b border-brand-light outline-none min-w-[160px]" />
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-medium cursor-pointer"
        onClick={(e) => { e.stopPropagation(); onOpen() }}>
        {task.title}
      </span>
      <button onClick={(e) => { e.stopPropagation(); setDraft(task.title); setEditing(true) }}
        aria-label="Renombrar tarea"
        className="opacity-0 group-hover:opacity-100 text-2 hover:text-brand dark:hover:text-brand-light">
        <Pencil size={12} />
      </button>
    </span>
  )
}

function StatusCell({ column, value, onChange, small = false, onEditColumn }) {
  const [open, setOpen] = useState(false)
  const opts = colOptions(column)

  if (colMulti(column)) {
    const ids = Array.isArray(value) ? value : (value != null ? [value] : [])
    const chosen = ids.map(id => opts.find(o => o.id === id)).filter(Boolean)
    const toggle = (id) => onChange(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id])
    return (
      <>
        <button onClick={(e) => { e.stopPropagation(); setOpen(true) }}
          className="flex flex-wrap items-center gap-1 min-h-[24px]">
          {chosen.length === 0
            ? <OptionPill option={null} small={small} asButton={false} />
            : chosen.map(o => <OptionPill key={o.id} option={o} small={small} asButton={false} />)}
        </button>
        <MultiOptionSheet open={open} onClose={() => setOpen(false)} title={column.name}
          options={opts} selected={ids} onToggle={toggle}
          onEdit={onEditColumn ? () => onEditColumn(column) : undefined} />
      </>
    )
  }

  return (
    <>
      <OptionPill option={findOption(column, value)} small={small} onClick={() => setOpen(true)} />
      <OptionSheet open={open} onClose={() => setOpen(false)}
        title={column.name} options={opts} value={value}
        onSelect={(id) => onChange(id)}
        onEdit={onEditColumn ? () => onEditColumn(column) : undefined} />
    </>
  )
}

function MultiOptionSheet({ open, onClose, title, options, selected, onToggle, onEdit }) {
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/30 anim-fade" onClick={onClose} />
      <div className="relative surface w-full sm:w-72 rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop max-h-[75dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <p className="text-sm font-semibold mb-3">{title}</p>
        <div className="flex flex-col gap-1.5">
          {options.map(opt => {
            const sel = selected.includes(opt.id)
            return (
              <button key={opt.id} onClick={() => onToggle(opt.id)}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-ios-sm text-sm font-medium text-left ${sel ? 'ring-2 ring-brand-light' : 'opacity-90'}`}
                style={{ backgroundColor: opt.color, color: '#fff' }}>
                {opt.label}{sel && <Check size={15} />}
              </button>
            )
          })}
          {options.length === 0 && <p className="text-xs text-2 px-1 py-1">Sin opciones. Usa "Editar opciones".</p>}
        </div>
        <button onClick={onClose} className="mt-3 w-full py-2.5 rounded-ios-sm btn-brand text-sm font-semibold">Listo</button>
        {onEdit && (
          <button onClick={() => { onClose(); onEdit() }}
            className="w-full mt-2 px-3 py-2 rounded-ios-sm text-sm font-medium text-brand dark:text-brand-light">
            Editar opciones…
          </button>
        )}
      </div>
    </div>,
    document.body
  )
}

export function CellValue({ column, value, members, onChange, small = false, onEditColumn }) {
  switch (column.type) {
    case 'status':
    case 'priority':
    case 'tag':
      return <StatusCell column={column} value={value} onChange={onChange} small={small} onEditColumn={onEditColumn} />
    case 'person':
      return <PersonCell value={value} members={members} onChange={onChange} />
    case 'date':
      return <DateCell value={value} onChange={onChange} />
    default:
      return <TagCell value={value} onChange={onChange} />
  }
}

function SubtaskRow({ s, columns, values, members, setValue, updateTask, deleteTask, onOpenTask, onEditColumn }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(s.title)
  const save = () => { const v = name.trim(); if (v && v !== s.title) updateTask(s.id, { title: v }); setEditing(false) }

  return (
    <tr className="border-b hairline surface-2 group">
      <td className="pl-3" onClick={e => e.stopPropagation()}>
        <Checkbox green size={16} checked={s.completed}
          onChange={() => updateTask(s.id, { completed: !s.completed })} ariaLabel="Completar subtarea" />
      </td>
      <td className="px-3 py-1.5">
        <div className="flex items-center gap-1.5 pl-5 min-w-0">
          <CornerDownRight size={13} className="text-2 shrink-0" />
          {editing ? (
            <input autoFocus value={name} onChange={e => setName(e.target.value)} onBlur={save}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setName(s.title); setEditing(false) } }}
              className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-brand-light" />
          ) : (
            <button onClick={() => { setName(s.title); setEditing(true) }}
              className={`text-sm text-left truncate ${s.completed ? 'line-through text-2' : ''}`}>
              {s.title}
            </button>
          )}
          <button onClick={() => onOpenTask?.(s)} aria-label="Abrir subtarea" title="Abrir (comentarios y detalle)"
            className="opacity-0 group-hover:opacity-100 text-2 hover:text-brand dark:hover:text-brand-light shrink-0">
            <Maximize2 size={13} />
          </button>
        </div>
      </td>
      {columns.map(c => (
        <td key={c.id} className="px-3 py-1.5" onClick={e => e.stopPropagation()}>
          <CellValue column={c} value={values[s.id]?.[c.id] ?? null}
            members={members} onEditColumn={onEditColumn}
            onChange={(v) => setValue(s.id, c.id, v)} />
        </td>
      ))}
      <td />
      <td className="px-2">
        <button onClick={() => deleteTask(s.id)} aria-label="Eliminar subtarea"
          className="opacity-0 group-hover:opacity-100 p-1 text-2 hover:text-[#E2445C]">
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  )
}

function AddSubtaskRow({ taskId, createTask, span }) {
  const [draft, setDraft] = useState('')
  return (
    <tr className="border-b hairline surface-2">
      <td />
      <td className="px-3 py-1.5" colSpan={span - 1}>
        <div className="flex items-center gap-1.5 pl-5 text-2">
          <Plus size={14} />
          <input value={draft} onChange={e => setDraft(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { createTask(draft.trim(), taskId); setDraft('') } }}
            placeholder="Agregar subtarea"
            className="flex-1 bg-transparent text-sm placeholder:text-2 outline-none" />
        </div>
      </td>
    </tr>
  )
}

// ---------- Tabla (desktop) ----------
export function TableView({ board, columns, topTasks, subtasksOf, values, members, createTask, updateTask, deleteTask, setValue, onOpenTask, onEditColumn, onAddColumn, selectedIds = [], onToggleSelect, onSelectAll }) {
  const [expanded, setExpanded] = useState({})
  const [draft, setDraft] = useState('')
  const span = columns.length + 4
  const allSelected = topTasks.length > 0 && topTasks.every(t => selectedIds.includes(t.id))

  return (
    <div className="surface rounded-ios border hairline overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b hairline text-left text-2 text-xs">
            <th className="w-9 pl-3">
              <Checkbox checked={allSelected}
                onChange={() => onSelectAll?.(allSelected ? [] : topTasks.map(t => t.id))}
                ariaLabel="Seleccionar todo" />
            </th>
            <th className="font-medium px-3 py-2.5 min-w-[240px]">Tarea</th>
            {columns.map(c => (
              <th key={c.id} className="font-medium px-3 py-2.5 whitespace-nowrap">
                <button onClick={() => onEditColumn?.(c)}
                  className="inline-flex items-center gap-1 hover:text-brand dark:hover:text-brand-light group/col">
                  {c.name}
                  <Settings2 size={11} className="opacity-0 group-hover/col:opacity-100" />
                </button>
              </th>
            ))}
            <th className="px-2 py-2.5">
              <button onClick={onAddColumn} aria-label="Añadir columna"
                className="p-1 rounded-full surface-2 text-2 hover:text-brand dark:hover:text-brand-light">
                <Plus size={14} />
              </button>
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {topTasks.map(task => {
            const subs = subtasksOf(task.id)
            const isOpen = !!expanded[task.id]
            const checked = selectedIds.includes(task.id)
            return (
              <FragmentRow key={task.id}>
                <tr className={`border-b hairline hover:surface-2 cursor-pointer group ${checked ? 'bg-brand-soft/50 dark:bg-brand-softDark/40' : ''}`}
                  onClick={() => onOpenTask(task)}>
                  <td className="pl-3" onClick={e => e.stopPropagation()}>
                    <Checkbox checked={checked} onChange={() => onToggleSelect?.(task.id)} ariaLabel="Seleccionar tarea" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <button aria-label="Subtareas"
                        onClick={(e) => { e.stopPropagation(); setExpanded(x => ({ ...x, [task.id]: !isOpen })) }}
                        className={`p-1 rounded text-2 hover:surface-2 ${subs.length ? '' : 'opacity-40'}`}>
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      <TitleCell task={task} onSave={(title) => updateTask(task.id, { title })} onOpen={() => onOpenTask(task)} />
                      {subs.length > 0 && (
                        <span className="text-[10px] text-2 surface-2 rounded-full px-1.5 py-0.5">
                          {subs.filter(s => s.completed).length}/{subs.length}
                        </span>
                      )}
                    </div>
                  </td>
                  {columns.map(c => (
                    <td key={c.id} className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <CellValue column={c} value={values[task.id]?.[c.id] ?? null}
                        members={members} onEditColumn={onEditColumn}
                        onChange={(v) => setValue(task.id, c.id, v)} />
                    </td>
                  ))}
                  <td />
                  <td className="px-2">
                    <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                      aria-label="Eliminar tarea"
                      className="opacity-0 group-hover:opacity-100 p-1 text-2 hover:text-[#E2445C]">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
                {isOpen && subs.map(s => (
                  <SubtaskRow key={s.id} s={s} columns={columns} values={values} members={members}
                    setValue={setValue} updateTask={updateTask} deleteTask={deleteTask}
                    onOpenTask={onOpenTask} onEditColumn={onEditColumn} />
                ))}
                {isOpen && <AddSubtaskRow taskId={task.id} createTask={createTask} span={span} />}
              </FragmentRow>
            )
          })}
          <tr>
            <td colSpan={span} className="px-4 py-2.5">
              <div className="flex items-center gap-2 text-2">
                <Plus size={15} />
                <input value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && draft.trim()) {
                      createTask(draft.trim())
                      setDraft('')
                    }
                  }}
                  placeholder="Nueva tarea — Enter para crear"
                  data-new-task
                  className="flex-1 bg-transparent text-sm placeholder:text-2" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// React no permite <></> con key dentro de map sin Fragment importado
import { Fragment } from 'react'
function FragmentRow({ children }) { return <Fragment>{children}</Fragment> }

// ---------- Cards (móvil) ----------
export function CardsView({ columns, topTasks, subtasksOf, values, members, createTask, setValue, onOpenTask, onEditColumn, selectedIds = [], onToggleSelect }) {
  const [draft, setDraft] = useState('')
  const statusCol = useMemo(() => columns.find(c => c.type === 'status'), [columns])
  const personCol = useMemo(() => columns.find(c => c.type === 'person'), [columns])
  const dateCol = useMemo(() => columns.find(c => c.type === 'date'), [columns])
  const tagCol = useMemo(() => columns.find(c => c.type === 'tag'), [columns])
  const prioCol = useMemo(() => columns.find(c => c.type === 'priority'), [columns])

  return (
    <div className="flex flex-col gap-3">
      {topTasks.map(task => {
        const subs = subtasksOf(task.id)
        const v = values[task.id] || {}
        const prio = prioCol ? findOption(prioCol, v[prioCol.id]) : null
        const checked = selectedIds.includes(task.id)
        return (
          <div key={task.id} onClick={() => onOpenTask(task)}
            className={`surface rounded-ios border hairline p-4 active:scale-[.99] transition-transform flex gap-3 cursor-pointer ${checked ? 'ring-2 ring-brand' : ''}`}>
            <div className="mt-1 shrink-0">
              <Checkbox checked={checked} onChange={() => onToggleSelect?.(task.id)} ariaLabel="Seleccionar tarea" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <p className="font-semibold text-[15px] leading-snug">{task.title}</p>
                {personCol && (
                  <PersonCell value={v[personCol.id]} members={members}
                    onChange={(val) => setValue(task.id, personCol.id, val)} />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statusCol && (
                  <StatusCell column={statusCol} value={v[statusCol.id] ?? null} small
                    onChange={(val) => setValue(task.id, statusCol.id, val)}
                    onEditColumn={onEditColumn} />
                )}
                {tagCol && (
                  <StatusCell column={tagCol} value={v[tagCol.id] ?? null} small
                    onChange={(val) => setValue(task.id, tagCol.id, val)}
                    onEditColumn={onEditColumn} />
                )}
                {prio && <OptionPill option={prio} small asButton={false} />}
                {dateCol && v[dateCol.id] && (
                  <span className="text-[11px] surface-2 rounded-full px-2.5 py-0.5 font-medium">
                    {formatDate(v[dateCol.id])}
                  </span>
                )}
                {subs.length > 0 && (
                  <span className="text-[11px] text-2">
                    ✓ {subs.filter(s => s.completed).length}/{subs.length}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div className="surface rounded-ios border hairline p-4 flex items-center gap-2 text-2">
        <Plus size={16} />
        <input value={draft} onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && draft.trim()) {
              createTask(draft.trim())
              setDraft('')
            }
          }}
          placeholder="Nueva tarea"
          data-new-task
          className="flex-1 bg-transparent text-sm placeholder:text-2" />
      </div>
    </div>
  )
}
