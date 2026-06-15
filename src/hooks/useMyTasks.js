import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

// Tareas asignadas a mí en todos los workspaces (columna tipo "person")
export function useMyTasks() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const { data: assignments, error } = await supabase
      .from('task_values')
      .select(`
        task_id, value,
        board_columns!inner(type),
        tasks!inner(id, title, completed, board_id, parent_task_id,
          boards!inner(id, name, workspace_id, workspaces(id, name, color)))
      `)
      .eq('board_columns.type', 'person')
      .contains('value', JSON.stringify([user.id]))
    if (error || !assignments?.length) { setItems([]); setLoading(false); return }

    const taskIds = assignments.map(a => a.task_id)
    const { data: vals } = await supabase
      .from('task_values')
      .select('task_id, value, board_columns!inner(id, type, options)')
      .in('task_id', taskIds)
      .in('board_columns.type', ['date', 'status'])

    const extra = {}
    for (const v of vals || []) {
      if (!extra[v.task_id]) extra[v.task_id] = {}
      extra[v.task_id][v.board_columns.type] = {
        value: v.value,
        columnId: v.board_columns.id,
        options: v.board_columns.options,
      }
    }

    setItems(assignments
      .filter(a => a.tasks && !a.tasks.parent_task_id)
      .map(a => ({
        task: a.tasks,
        board: a.tasks.boards,
        workspace: a.tasks.boards?.workspaces,
        date: extra[a.task_id]?.date?.value ?? null,
        status: extra[a.task_id]?.status ?? null,
      })))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  const setStatus = async (item, optionId) => {
    if (!item.status?.columnId) return
    await supabase.from('task_values').upsert(
      {
        task_id: item.task.id, column_id: item.status.columnId,
        board_id: item.task.board_id, value: optionId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'task_id,column_id' }
    )
    fetchAll()
  }

  return { items, loading, setStatus, refetch: fetchAll }
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(full_name, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(80)
    setNotifications(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    if (!user) return
    const refresh = () => fetchAll()
    window.addEventListener('notifications-changed', refresh)
    const channel = supabase.channel(`notifs-${user.id}-${Math.random().toString(36).slice(2)}`)
    channel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => fetchAll())
      .subscribe()
    return () => { window.removeEventListener('notifications-changed', refresh); supabase.removeChannel(channel) }
  }, [user?.id])

  const unreadCount = notifications.filter(n => !n.read).length

  const markRead = async (id) => {
    setNotifications(ns => ns.map(n => (n.id === id ? { ...n, read: true } : n)))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    window.dispatchEvent(new Event('notifications-changed'))
  }

  const markAllRead = async () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    window.dispatchEvent(new Event('notifications-changed'))
  }

  return { notifications, unreadCount, loading, markRead, markAllRead }
}
