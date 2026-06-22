import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckSquare, CalendarDays, List, Plus } from 'lucide-react'
import { useMyTasks } from '../hooks/useMyTasks'
import { OptionPill, OptionSheet } from '../components/ui'
import { AddTaskModal } from '../components/AddTaskModal'
import { TaskQuickView } from '../components/TaskQuickView'
import { dateGroup, formatDate } from '../lib/constants'

const GROUP_META = [
  { key: 'vencidas', label: 'Vencidas', accent: '#E2445C' },
  { key: 'hoy', label: 'Hoy', accent: '#FDAB3D' },
  { key: 'proximamente', label: 'Próximamente', accent: '#0086C0' },
  { key: 'sin_fecha', label: 'Sin fecha', accent: '#9A9AA6' },
]

function statusOption(item) {
  if (!item.status) return null
  return (item.status.options || []).find(o => o.id === item.status.value) || null
}

function TaskRow({ item, onStatus, onOpen }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const opt = statusOption(item)
  return (
    <div className="flex items-center gap-3 px-4 py-3 surface border-b hairline last:border-0">
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate">{item.task.title}</p>
        <p className="text-[11px] text-2 truncate">
          {item.workspace?.name} · {item.board?.name}
          {item.date ? ` · ${formatDate(item.date)}` : ''}
        </p>
      </button>
      {item.status && (
        <>
          <OptionPill option={opt} small onClick={() => setPickerOpen(true)} />
          <OptionSheet open={pickerOpen} onClose={() => setPickerOpen(false)}
            title="Estado" options={item.status.options || []} value={item.status.value}
            onSelect={(id) => onStatus(item, id)} />
        </>
      )}
    </div>
  )
}

export default function MisTareas() {
  const { items, loading, setStatus, refetch } = useMyTasks()
  const navigate = useNavigate()
  const [addOpen, setAddOpen] = useState(false)
  const [quick, setQuick] = useState(null)

  useEffect(() => {
    const h = () => setAddOpen(true)
    window.addEventListener('quick-create-task', h)
    return () => window.removeEventListener('quick-create-task', h)
  }, [])

  const grouped = useMemo(() => {
    const g = { vencidas: [], hoy: [], proximamente: [], sin_fecha: [] }
    for (const it of items) {
      if (it.task.completed) continue
      g[dateGroup(it.date)].push(it)
    }
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'))
    }
    return g
  }, [items])

  const total = items.filter(i => !i.task.completed).length

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Mis Tareas</h1>
          <p className="text-sm text-2">{total} tareas asignadas a ti</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex surface-2 rounded-full p-1 gap-0.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold btn-brand">
              <List size={13} /> <span className="hidden sm:inline">Lista</span>
            </button>
            <button onClick={() => navigate('/calendario')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-2">
              <CalendarDays size={13} /> <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>
          <button onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-ios-sm btn-brand text-sm font-semibold active:scale-95 transition-transform">
            <Plus size={15} /> <span className="hidden sm:inline">Tarea</span>
          </button>
        </div>
      </div>

      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} onCreated={refetch} />

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : total === 0 ? (
        <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2">
          <CheckSquare size={28} />
          <p className="text-sm text-center">No tienes tareas asignadas. Cuando alguien te asigne a una tarea, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {GROUP_META.map(({ key, label, accent }) => {
            const list = grouped[key]
            if (!list.length) return null
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                  <h2 className="text-sm font-semibold">{label}</h2>
                  <span className="text-xs text-2">{list.length}</span>
                </div>
                <div className="surface rounded-ios border hairline overflow-hidden">
                  {list.map(item => (
                    <TaskRow key={item.task.id} item={item}
                      onStatus={setStatus}
                      onOpen={() => setQuick({ taskId: item.task.id, boardId: item.board.id })} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
      {quick && (
        <TaskQuickView taskId={quick.taskId} boardId={quick.boardId}
          onClose={() => setQuick(null)} onChanged={refetch} />
      )}
    </div>
  )
}
