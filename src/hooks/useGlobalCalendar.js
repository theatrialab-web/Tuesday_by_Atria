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
    setEventsByDate(map)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { eventsByDate, loading, refetch: fetchAll }
}
