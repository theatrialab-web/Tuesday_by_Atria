import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { Avatar, OptionPill, OptionSheet, WorkspaceIcon } from './ui'
import { formatDate } from '../lib/constants'

function StatusQuick({ row, onSetStatus }) {
  const [open, setOpen] = useState(false)
  if (!row.statusColId) return <span className="text-2 text-xs">—</span>
  return (
    <>
      <OptionPill option={row.statusOption} small onClick={() => setOpen(true)} />
      <OptionSheet open={open} onClose={() => setOpen(false)}
        title="Estado" options={row.statusOptions} value={row.statusValue}
        onSelect={(id) => onSetStatus(row, id)} />
    </>
  )
}

export function WorkspaceTable({ tasks, members, onSetStatus, onOpenTask, onOpenBoard, selectedIds, onToggleSelect, onSelectAll }) {
  const allSelected = tasks.length > 0 && tasks.every(t => selectedIds.includes(t.id))
  const byId = Object.fromEntries(members.map(m => [m.id, m]))
  const [collapsed, setCollapsed] = useState({})

  // Agrupar por board, conservando el orden de aparición.
  const groups = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      if (!map.has(t.boardId)) {
        map.set(t.boardId, { boardId: t.boardId, boardName: t.boardName, boardColor: t.boardColor, boardIcon: t.boardIcon, tasks: [] })
      }
      map.get(t.boardId).tasks.push(t)
    }
    return [...map.values()]
  }, [tasks])

  if (tasks.length === 0) {
    return <p className="text-sm text-2 surface border hairline rounded-ios p-8 text-center">Este workspace no tiene tareas todavía.</p>
  }

  const Row = ({ t }) => {
    const checked = selectedIds.includes(t.id)
    const assigned = t.assignees.map(id => byId[id]).filter(Boolean)
    return (
      <tr className={`border-b hairline hover:surface-2 ${checked ? 'bg-brand-soft/50 dark:bg-brand-softDark/40' : ''}`}>
        <td className="pl-3">
          <input type="checkbox" checked={checked}
            onChange={() => onToggleSelect(t.id)}
            className="w-4 h-4 rounded accent-brand" aria-label="Seleccionar tarea" />
        </td>
        <td className="px-3 py-2">
          <button onClick={() => onOpenTask(t)} className="font-medium text-left hover:text-brand dark:hover:text-brand-light">
            {t.title}
          </button>
        </td>
        <td className="px-3 py-2"><StatusQuick row={t} onSetStatus={onSetStatus} /></td>
        <td className="px-3 py-2">
          <div className="flex -space-x-1.5">
            {assigned.slice(0, 3).map(m => <Avatar key={m.id} profile={m} size={24} />)}
            {assigned.length === 0 && <span className="text-2 text-xs">—</span>}
          </div>
        </td>
        <td className="px-3 py-2">
          <span className={`text-xs ${t.date ? '' : 'text-2'}`}>{t.date ? formatDate(t.date) : '—'}</span>
        </td>
      </tr>
    )
  }

  return (
    <div className="surface rounded-ios border hairline overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="border-b hairline text-left text-2 text-xs">
            <th className="w-9 pl-3">
              <input type="checkbox" checked={allSelected}
                onChange={() => onSelectAll(allSelected ? [] : tasks.map(t => t.id))}
                className="w-4 h-4 rounded accent-brand" aria-label="Seleccionar todo" />
            </th>
            <th className="font-medium px-3 py-2.5 min-w-[240px]">Tarea</th>
            <th className="font-medium px-3 py-2.5">Estado</th>
            <th className="font-medium px-3 py-2.5">Personas</th>
            <th className="font-medium px-3 py-2.5">Fecha</th>
          </tr>
        </thead>
        {groups.map(g => {
          const isCollapsed = !!collapsed[g.boardId]
          const done = g.tasks.filter(t => t.completed).length
          return (
            <tbody key={g.boardId}>
              <tr className="surface-2">
                <td colSpan={5} className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCollapsed(c => ({ ...c, [g.boardId]: !isCollapsed }))}
                      aria-label={isCollapsed ? 'Mostrar' : 'Ocultar'} className="text-2 shrink-0">
                      <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                    </button>
                    <WorkspaceIcon icon={g.boardIcon || '📋'} color={g.boardColor || '#E4E4E9'} size={22} />
                    <button onClick={() => onOpenBoard(g.boardId)}
                      className="font-semibold text-sm inline-flex items-center gap-1 hover:text-brand dark:hover:text-brand-light">
                      {g.boardName} <ExternalLink size={12} className="opacity-60" />
                    </button>
                    <span className="text-[11px] text-2">{done}/{g.tasks.length}</span>
                  </div>
                </td>
              </tr>
              {!isCollapsed && g.tasks.map(t => <Row key={t.id} t={t} />)}
            </tbody>
          )
        })}
      </table>
    </div>
  )
}
