import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_COLUMNS } from '../lib/constants'

export function useBoards(workspaceId) {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchBoards = useCallback(async () => {
    if (!workspaceId) return
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
    if (!error) setBoards(data || [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchBoards() }, [fetchBoards])

  useEffect(() => {
    const h = () => fetchBoards()
    window.addEventListener('boards-changed', h)
    return () => window.removeEventListener('boards-changed', h)
  }, [fetchBoards])

  const createBoard = async (name, icon = null) => {
    const { data: board, error } = await supabase
      .from('boards')
      .insert({ workspace_id: workspaceId, name, icon, position: boards.length })
      .select()
      .single()
    if (error) throw error

    const cols = DEFAULT_COLUMNS.map(c => ({ ...c, board_id: board.id }))
    const { error: colErr } = await supabase.from('board_columns').insert(cols)
    if (colErr) throw colErr

    setBoards(b => [...b, board])
    window.dispatchEvent(new CustomEvent('boards-changed'))
    return board
  }

  const updateBoard = async (id, patch) => {
    setBoards(b => b.map(x => (x.id === id ? { ...x, ...patch } : x)))
    const { error } = await supabase.from('boards').update(patch).eq('id', id)
    if (error) { fetchBoards(); throw error }
    window.dispatchEvent(new CustomEvent('boards-changed'))
  }

  const deleteBoards = async (ids) => {
    const set = new Set(ids)
    setBoards(b => b.filter(x => !set.has(x.id)))
    const { error } = await supabase.from('boards').delete().in('id', ids)
    if (error) { fetchBoards(); throw error }
    window.dispatchEvent(new CustomEvent('boards-changed'))
  }

  return { boards, loading, createBoard, updateBoard, deleteBoards, refetch: fetchBoards }
}
