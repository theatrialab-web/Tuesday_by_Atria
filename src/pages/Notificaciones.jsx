import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, AtSign, RefreshCw, CheckCheck, Activity, Plus, Check, RotateCcw, Pencil, MessageSquare, SlidersHorizontal } from 'lucide-react'
import { useNotifications } from '../hooks/useMyTasks'
import { useActivity } from '../hooks/useActivity'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { Avatar, WorkspaceIcon, WorkspaceDropdown, Segmented } from '../components/ui'
import { TaskQuickView } from '../components/TaskQuickView'

const TYPE_META = {
  assigned: { icon: UserPlus, color: '#0086C0', verb: 'te asignó a' },
  mentioned: { icon: AtSign, color: '#A25DDC', verb: 'te mencionó en' },
  status_changed: { icon: RefreshCw, color: '#FDAB3D', verb: 'cambió el estado de' },
}

const ACT_META = {
  task_created:   { icon: Plus,             color: '#00C875', label: (d) => <>creó <b>{d || 'una tarea'}</b></> },
  task_completed: { icon: Check,            color: '#00C875', label: (d) => <>completó <b>{d}</b></> },
  task_reopened:  { icon: RotateCcw,        color: '#FDAB3D', label: (d) => <>reabrió <b>{d}</b></> },
  task_renamed:   { icon: Pencil,           color: '#A25DDC', label: (d) => <>renombró una tarea a <b>{d}</b></> },
  commented:      { icon: MessageSquare,    color: '#0086C0', label: (d) => <>comentó: <span className="text-2">“{d}”</span></> },
  value_changed:  { icon: SlidersHorizontal, color: '#FDAB3D', label: (d) => <>actualizó <b>{d || 'una columna'}</b></> },
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function Notificaciones() {
  const { notifications, unreadCount, loading, markRead, markAllRead } = useNotifications()
  const { items: activity, loading: actLoading, refetch: refetchActivity } = useActivity()
  const { workspaces } = useWorkspaces()
  const navigate = useNavigate()
  const [tab, setTab] = useState('mine')
  const [wsFilter, setWsFilter] = useState('all')
  const [quick, setQuick] = useState(null)

  useEffect(() => { if (tab === 'team') refetchActivity() }, [tab])

  const openNotif = (n) => {
    if (!n.read) markRead(n.id)
    if (n.task_id && n.board_id) setQuick({ taskId: n.task_id, boardId: n.board_id })
    else if (n.board_id) navigate(`/board/${n.board_id}`)
  }

  const openActivity = (a) => {
    if (a.task_id && a.board_id) setQuick({ taskId: a.task_id, boardId: a.board_id })
    else if (a.board_id) navigate(`/board/${a.board_id}`)
  }

  const filteredActivity = useMemo(
    () => wsFilter === 'all' ? activity : activity.filter(a => a.workspace_id === wsFilter),
    [activity, wsFilter])

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        {tab === 'mine' && unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-brand dark:text-brand-light">
            <CheckCheck size={16} /> Marcar todas
          </button>
        )}
      </div>

      <div className="mb-5 max-w-md">
        <Segmented value={tab} onChange={setTab}
          options={[
            { value: 'mine', label: `Mis notificaciones${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
            { value: 'team', label: 'Actividad del equipo' },
          ]} />
      </div>

      {tab === 'mine' && (
        loading ? <p className="text-sm text-2">Cargando…</p>
        : notifications.length === 0 ? (
          <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2">
            <Bell size={28} />
            <p className="text-sm text-center">No tienes notificaciones todavía.</p>
          </div>
        ) : (
          <div className="surface rounded-ios border hairline overflow-hidden">
            {notifications.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.assigned
              const Icon = meta.icon
              return (
                <button key={n.id} onClick={() => openNotif(n)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b hairline last:border-0 ${n.read ? '' : 'bg-brand-soft/50 dark:bg-brand-softDark/40'}`}>
                  <div className="relative">
                    <Avatar profile={n.actor} size={36} />
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white border-2"
                      style={{ backgroundColor: meta.color, borderColor: 'var(--surface)' }}>
                      <Icon size={9} />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{n.actor?.full_name || 'Alguien'}</span>{' '}
                      {meta.verb}{' '}
                      <span className="font-medium">{n.content || 'una tarea'}</span>
                    </p>
                    <p className="text-[11px] text-2">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
                </button>
              )
            })}
          </div>
        )
      )}

      {tab === 'team' && (
        <>
          <div className="mb-4 max-w-xs">
            <WorkspaceDropdown workspaces={workspaces} value={wsFilter} onChange={setWsFilter}
              allowAll placeholder="Todos los clientes" title="Filtrar por cliente" />
          </div>
          {actLoading ? <p className="text-sm text-2">Cargando…</p>
          : filteredActivity.length === 0 ? (
            <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2">
              <Activity size={28} />
              <p className="text-sm text-center">Sin actividad todavía. Aquí verás lo que hace todo el equipo.</p>
            </div>
          ) : (
            <div className="surface rounded-ios border hairline overflow-hidden">
              {filteredActivity.map(a => {
                const meta = ACT_META[a.action] || ACT_META.value_changed
                const Icon = meta.icon
                return (
                  <button key={a.id} onClick={() => openActivity(a)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b hairline last:border-0 hover:surface-2">
                    <div className="relative shrink-0">
                      <Avatar profile={a.actor} size={36} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white border-2"
                        style={{ backgroundColor: meta.color, borderColor: 'var(--surface)' }}>
                        <Icon size={9} />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">
                        <span className="font-semibold">{a.actor?.full_name || 'Alguien'}</span>{' '}
                        {meta.label(a.detail)}
                      </p>
                      <p className="text-[11px] text-2 flex items-center gap-1.5 mt-0.5">
                        {a.workspace && <span className="inline-flex items-center gap-1">
                          <WorkspaceIcon icon={a.workspace.icon} color={a.workspace.color} size={14} round />
                          {a.workspace.name}
                        </span>}
                        <span>· {timeAgo(a.created_at)}</span>
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {quick && (
        <TaskQuickView taskId={quick.taskId} boardId={quick.boardId} onClose={() => setQuick(null)} />
      )}
    </div>
  )
}
