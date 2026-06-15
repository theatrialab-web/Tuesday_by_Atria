import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useMeetings(workspaceId) {
  const { user } = useAuth()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    const { data } = await supabase.from('meetings').select('*')
      .eq('workspace_id', workspaceId).order('starts_at', { ascending: true })
    setMeetings(data || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createMeeting = async (m) => {
    const { data, error } = await supabase.from('meetings')
      .insert({ workspace_id: workspaceId, created_by: user?.id, ...m })
      .select().single()
    if (error) throw error
    setMeetings(ms => [...ms, data].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1)))
    return data
  }

  const updateMeeting = async (id, patch) => {
    setMeetings(ms => ms.map(m => (m.id === id ? { ...m, ...patch } : m)))
    const { error } = await supabase.from('meetings').update(patch).eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  const deleteMeeting = async (id) => {
    setMeetings(ms => ms.filter(m => m.id !== id))
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  return { meetings, loading, createMeeting, updateMeeting, deleteMeeting, refetch: fetchAll }
}

// Todas las reuniones de todos los workspaces del usuario.
export function useAllMeetings() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data } = await supabase.from('meetings')
      .select('*, workspaces(name, color, icon)')
      .order('starts_at', { ascending: true })
    setMeetings(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const createMeeting = async (m) => {
    const { data, error } = await supabase.from('meetings').insert(m).select('*, workspaces(name, color, icon)').single()
    if (error) throw error
    setMeetings(ms => [...ms, data].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1)))
    return data
  }

  const deleteMeeting = async (id) => {
    setMeetings(ms => ms.filter(m => m.id !== id))
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) { fetchAll(); throw error }
  }

  return { meetings, loading, createMeeting, deleteMeeting, refetch: fetchAll }
}
