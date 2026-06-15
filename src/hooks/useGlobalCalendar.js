import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Junta todas las tareas con fecha de los boards a los que el usuario tiene
// acceso. La RLS ya limita los valores a sus boards, así que no hace falta
// filtrar por workspace manualmente.
export function useGlobalCalendar() {
  const { user } = useAuth()
  const [eventsByDate, setEventsByDate] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('task_values')
      .select(`
        value,
        board_columns!inner(type),
        tasks!inner(id, title, completed, parent_task_id,
          boards!inner(id, name, workspaces(id, name, color)))
      `)
      .eq('board_columns.type', 'date')

    const map = {}
    if (!error && data) {
      for (const row of data) {
        const d = row.value
        const t = row.tasks
        if (!d || typeof d !== 'string' || !t || t.parent_task_id) continue
        const ev = {
          taskId: t.id,
          title: t.title,
          completed: t.completed,
          boardId: t.boards?.id,
          boardName: t.boards?.name,
          wsName: t.boards?.workspaces?.name,
          color: t.boards?.workspaces?.color || '#290880',
        }
        if (!map[d]) map[d] = []
        map[d].push(ev)
      }
    }

    // Reuniones (RLS limita a los workspaces del usuario)
    const { data: meets } = await supabase
      .from('meetings')
      .select('id, title, starts_at, link, duration_min, workspaces(name)')
    if (meets) {
      const pad = (n) => String(n).padStart(2, '0')
      for (const m of meets) {
        const dt = new Date(m.starts_at)
        const d = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
        const time = dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        if (!map[d]) map[d] = []
        map[d].push({
          type: 'meeting',
          meetingId: m.id,
          title: `${time} ${m.title}`,
          link: m.link,
          wsName: m.workspaces?.name,
          color: '#6C4FF7',
        })
      }
    }

    setEventsByDate(map)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { eventsByDate, loading, refetch: fetchAll }
}
