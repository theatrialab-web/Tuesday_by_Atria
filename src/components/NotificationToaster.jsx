import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from './ui'
import { playNotificationSound } from '../lib/sound'

function describe(n) {
  const t = n.content ? `"${n.content}"` : 'una tarea'
  if (n.type === 'assigned') return `Te asignó a ${t}`
  if (n.type === 'status_changed') return `Actualizó el estado de ${t}`
  if (n.type === 'mentioned') return `Te mencionó en ${t}`
  return n.content || 'Nueva notificación'
}

export function NotificationToaster({ onOpenTask }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])

  const dismiss = (id) => setToasts(ts => ts.filter(t => t.id !== id))

  useEffect(() => {
    if (!user) return
    const channel = supabase.channel(`toast-${user.id}-${Math.random().toString(36).slice(2)}`)
    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          playNotificationSound()
          const { data } = await supabase
            .from('notifications')
            .select('*, actor:profiles!notifications_actor_id_fkey(full_name, avatar_url), board:boards(name, icon)')
            .eq('id', payload.new.id)
            .single()
          const n = data || payload.new

          // Pestaña en segundo plano + permiso concedido → notificación del sistema.
          const hidden = typeof document !== 'undefined' && document.hidden
          if (hidden && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              const title = `${n.actor?.full_name || 'Alguien'}${n.board?.name ? ' · ' + n.board.name : ''}`
              const note = new Notification(title, { body: describe(n), icon: '/favicon.svg', tag: n.id })
              note.onclick = () => {
                window.focus()
                if (n.task_id && n.board_id && onOpenTask) onOpenTask({ taskId: n.task_id, boardId: n.board_id })
                else if (n.board_id) navigate(`/board/${n.board_id}`)
                note.close()
              }
              return
            } catch (_) { /* si falla, caemos al toast in-app */ }
          }
          // Pestaña al frente → toast dentro de la app.
          setToasts(ts => [...ts, n].slice(-4))
          setTimeout(() => dismiss(n.id), 6500)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed right-3 bottom-20 sm:bottom-4 z-[90] flex flex-col gap-2 w-[320px] max-w-[calc(100vw-1.5rem)]">
      {toasts.map(n => (
        <div key={n.id} role="status"
          className="surface border hairline rounded-ios shadow-2xl p-3 flex items-start gap-3 anim-pop">
          <Avatar profile={n.actor} size={34} />
          <button onClick={() => {
              dismiss(n.id)
              if (n.task_id && n.board_id && onOpenTask) onOpenTask({ taskId: n.task_id, boardId: n.board_id })
              else if (n.board_id) navigate(`/board/${n.board_id}`)
            }}
            className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-semibold truncate">
              {n.actor?.full_name || 'Alguien'}
              {n.board?.name && <span className="text-2 font-normal"> · {n.board.name}</span>}
            </p>
            <p className="text-xs text-2 line-clamp-2 mt-0.5">{describe(n)}</p>
          </button>
          <button onClick={() => dismiss(n.id)} aria-label="Cerrar"
            className="p-1 rounded-full surface-2 text-2 shrink-0"><X size={13} /></button>
        </div>
      ))}
    </div>,
    document.body
  )
}
