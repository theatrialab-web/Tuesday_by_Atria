import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useWorkspaces() {
  const { user } = useAuth()
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true })
    if (!error) setWorkspaces(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) fetchWorkspaces() }, [user, fetchWorkspaces])

  // Mantener en sync todas las instancias del hook (sidebar, home, etc.)
  useEffect(() => {
    const h = () => fetchWorkspaces()
    window.addEventListener('workspaces-changed', h)
    return () => window.removeEventListener('workspaces-changed', h)
  }, [fetchWorkspaces])

  const createWorkspace = async ({ name, icon, color }) => {
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name, icon, color, owner_id: user.id })
      .select()
      .single()
    if (error) throw error
    setWorkspaces(ws => [...ws, data])
    window.dispatchEvent(new CustomEvent('workspaces-changed'))
    return data
  }

  const deleteWorkspace = async (id) => {
    setWorkspaces(ws => ws.filter(w => w.id !== id))
    const { error } = await supabase.from('workspaces').delete().eq('id', id)
    if (error) { fetchWorkspaces(); throw error }
    window.dispatchEvent(new CustomEvent('workspaces-changed'))
  }

  const updateWorkspace = async (id, patch) => {
    setWorkspaces(ws => ws.map(w => (w.id === id ? { ...w, ...patch } : w)))
    const { error } = await supabase.from('workspaces').update(patch).eq('id', id)
    if (error) { fetchWorkspaces(); throw error }
    window.dispatchEvent(new CustomEvent('workspaces-changed'))
  }

  return { workspaces, loading, createWorkspace, deleteWorkspace, updateWorkspace, refetch: fetchWorkspaces }
}

export function useWorkspace(workspaceId) {
  const [workspace, setWorkspace] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    const [{ data: ws }, { data: mem }] = await Promise.all([
      supabase.from('workspaces').select('*').eq('id', workspaceId).single(),
      supabase.from('workspace_members')
        .select('user_id, profiles(id, full_name, email, avatar_url)')
        .eq('workspace_id', workspaceId),
    ])
    setWorkspace(ws)
    setMembers((mem || []).map(m => m.profiles).filter(Boolean))
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const inviteByEmail = async (email) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', email.trim())
      .maybeSingle()
    if (error) throw error
    if (!profile) {
      throw new Error('No existe ningún usuario con ese email. La persona debe iniciar sesión en la app al menos una vez antes de poder ser invitada.')
    }
    const { error: insErr } = await supabase
      .from('workspace_members')
      .insert({ workspace_id: workspaceId, user_id: profile.id })
    if (insErr) {
      if (insErr.code === '23505') throw new Error('Esa persona ya es miembro del workspace.')
      throw insErr
    }
    await fetchAll()
    return profile
  }

  const removeMember = async (userId) => {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
    if (error) throw error
    setMembers(m => m.filter(x => x.id !== userId))
  }

  return { workspace, members, loading, inviteByEmail, removeMember, refetch: fetchAll }
}
