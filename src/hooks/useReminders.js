import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useReminders() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('reminders')
      .select('*, task:tasks(title), board:boards(name, icon, color)')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true })
      .limit(100)
    setItems(data || [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createReminder = async ({ title, remindAt, taskId = null, boardId = null }) => {
    const { error } = await supabase.from('reminders').insert({
      user_id: user.id, title, remind_at: remindAt, task_id: taskId, board_id: boardId,
    })
    if (!error) fetchAll()
    return !error
  }

  const deleteReminder = async (id) => {
    await supabase.from('reminders').delete().eq('id', id)
    fetchAll()
  }

  return { items, loading, createReminder, deleteReminder, refetch: fetchAll }
}

// Verificador global: dispara recordatorios vencidos creando una notificacion.
// La notificacion reutiliza el toaster, el sonido y el contador existentes.
export function useReminderChecker() {
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    let stop = false
    const check = async () => {
      const nowIso = new Date().toISOString()
      const { data } = await supabase
        .from('reminders')
        .select('id, title, task_id, board_id')
        .eq('user_id', user.id).eq('fired', false).lte('remind_at', nowIso).limit(20)
      for (const r of (data || [])) {
        // Marcar disparado de forma atomica: solo una pestaña "gana".
        const { data: upd } = await supabase.from('reminders')
          .update({ fired: true }).eq('id', r.id).eq('fired', false).select('id')
        if (upd && upd.length) {
          await supabase.from('notifications').insert({
            user_id: user.id, actor_id: user.id, type: 'reminder',
            content: r.title, task_id: r.task_id, board_id: r.board_id, read: false,
          })
        }
      }
    }
    check()
    const id = setInterval(() => { if (!stop) check() }, 30000)
    return () => { stop = true; clearInterval(id) }
  }, [user?.id])
}
