import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useActivity(limit = 100) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('activity')
      .select('*, actor:profiles!activity_actor_id_fkey(id, full_name, avatar_url), workspace:workspaces(id, name, color, icon), task:tasks(title)')
      .order('created_at', { ascending: false })
      .limit(limit)
    setItems(data || [])
    setLoading(false)
  }, [limit])

  useEffect(() => {
    if (!user) return
    fetchAll()
    const channel = supabase.channel(`activity-${user.id}-${Math.random().toString(36).slice(2)}`)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity' }, () => fetchAll())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, fetchAll])

  return { items, loading, refetch: fetchAll }
}
