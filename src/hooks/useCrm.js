import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const CRM_STAGES = [
  { id: 'prospecto',   label: 'Prospecto',    color: '#579BFC' },
  { id: 'propuesta',   label: 'Propuesta',    color: '#A25DDC' },
  { id: 'negociacion', label: 'Negociación',  color: '#FDAB3D' },
  { id: 'activo',      label: 'Activo',       color: '#00C875' },
  { id: 'pausa',       label: 'En pausa',     color: '#9AA0A6' },
  { id: 'finalizado',  label: 'Finalizado',   color: '#66707C' },
]

// Dias hasta el fin de contrato (negativo = vencido)
export function daysToRenewal(client) {
  if (!client?.contract_end) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, m, d] = client.contract_end.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}

export function useCrm() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from('crm_clients')
      .select('*, owner:profiles!crm_clients_owner_id_fkey(id, full_name, avatar_url), workspace:workspaces(id, name, icon, color)')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    setClients(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { if (user) fetchAll() }, [user?.id, fetchAll])

  const createClient = async (patch) => {
    const stage = patch.stage || 'prospecto'
    const inStage = clients.filter(c => c.stage === stage)
    const position = inStage.length ? Math.max(...inStage.map(c => c.position || 0)) + 1 : 1
    const { data, error } = await supabase.from('crm_clients')
      .insert({ ...patch, stage, position, owner_id: patch.owner_id ?? user.id })
      .select('id').single()
    if (!error) fetchAll()
    return error ? null : data.id
  }

  const updateClient = async (id, patch) => {
    setClients(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c)))
    const { error } = await supabase.from('crm_clients').update(patch).eq('id', id)
    if (error) fetchAll()
  }

  const deleteClient = async (id) => {
    setClients(cs => cs.filter(c => c.id !== id))
    await supabase.from('crm_clients').delete().eq('id', id)
  }

  // Mover a etapa (al final de la columna destino)
  const moveToStage = async (id, stage) => {
    const inStage = clients.filter(c => c.stage === stage && c.id !== id)
    const position = inStage.length ? Math.max(...inStage.map(c => c.position || 0)) + 1 : 1
    await updateClient(id, { stage, position })
  }

  return { clients, loading, createClient, updateClient, deleteClient, moveToStage, refetch: fetchAll }
}

export function useClientInteractions(clientId) {
  const { user } = useAuth()
  const [items, setItems] = useState([])

  const fetchAll = useCallback(async () => {
    if (!clientId) return
    const { data } = await supabase
      .from('crm_interactions')
      .select('*, author:profiles!crm_interactions_user_id_fkey(id, full_name, avatar_url)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(100)
    setItems(data || [])
  }, [clientId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const addInteraction = async (kind, content) => {
    const { error } = await supabase.from('crm_interactions')
      .insert({ client_id: clientId, user_id: user.id, kind, content })
    if (!error) fetchAll()
    return !error
  }

  const deleteInteraction = async (id) => {
    await supabase.from('crm_interactions').delete().eq('id', id)
    fetchAll()
  }

  return { items, addInteraction, deleteInteraction }
}
