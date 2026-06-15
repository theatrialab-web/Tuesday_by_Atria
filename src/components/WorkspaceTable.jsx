import { useState } from 'react'
import { Avatar, OptionPill, OptionSheet } from './ui'
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

  if (tasks.length === 0) {
    return <p className="text-sm text-2 surface border hairline rounded-ios p-8 text-center">Este workspace no tiene tareas todavía.</p>
  }

  return (
    <div className="surface rounded-ios border hairline overflow-x-auto">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="border-b hairline text-left text-2 text-xs">
            <th className="w-9 pl-3">
              <input type="checkbox" checked={allSelected}
                onChange={() => onSelectAll(allSelected ? [] : tasks.map(t => t.id))}
                className="w-4 h-4 rounded accent-brand" aria-label="Seleccionar todo" />
            </th>
            <th className="font-medium px-3 py-2.5 min-w-[220px]">Tarea</th>
            <th className="font-medium px-3 py-2.5">Board</th>
            <th className="font-medium px-3 py-2.5">Estado</th>
            <th className="font-medium px-3 py-2.5">Personas</th>
            <th className="font-medium px-3 py-2.5">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(t => {
            const checked = selectedIds.includes(t.id)
            const assigned = t.assignees.map(id => byId[id]).filter(Boolean)
            return (
              <tr key={t.id}
                className={`border-b hairline hover:surface-2 ${checked ? 'bg-brand-soft/50 dark:bg-brand-softDark/40' : ''}`}>
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
                <td className="px-3 py-2">
                  <button onClick={() => onOpenBoard(t.boardId)}
                    className="text-xs rounded-full px-2.5 py-0.5 font-medium text-white whitespace-nowrap"
                    style={{ backgroundColor: t.boardColor }}>
                    {t.boardName}
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
          })}
        </tbody>
      </table>
    </div>
  )
}
