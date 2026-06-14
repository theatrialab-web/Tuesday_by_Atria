import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, UserPlus, AtSign, RefreshCw, CheckCheck } from 'lucide-react'
import { useNotifications } from '../hooks/useMyTasks'
import { Avatar } from '../components/ui'
import { TaskQuickView } from '../components/TaskQuickView'

const TYPE_META = {
  assigned: { icon: UserPlus, color: '#0086C0', verb: 'te asignó a' },
  mentioned: { icon: AtSign, color: '#A25DDC', verb: 'te mencionó en' },
  status_changed: { icon: RefreshCw, color: '#FDAB3D', verb: 'cambió el estado de' },
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
  const navigate = useNavigate()
  const [quick, setQuick] = useState(null)

  const openNotif = (n) => {
    if (!n.read) markRead(n.id)
    if (n.task_id && n.board_id) setQuick({ taskId: n.task_id, boardId: n.board_id })
    else if (n.board_id) navigate(`/board/${n.board_id}`)
  }

  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Notificaciones</h1>
          <p className="text-sm text-2">{unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-brand dark:text-brand-light">
            <CheckCheck size={16} /> Marcar todas
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : notifications.length === 0 ? (
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
              <button key={n.id}
                onClick={() => openNotif(n)}
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
      )}
      {quick && (
        <TaskQuickView taskId={quick.taskId} boardId={quick.boardId} onClose={() => setQuick(null)} />
      )}
    </div>
  )
}
