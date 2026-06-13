import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DEFAULT_STATUS_OPTIONS, PRIORITY_OPTIONS, buildOptions } from '../lib/constants'

// Carga y mantiene en vivo: board + columnas + tareas + valores + miembros.
export function useBoard(boardId) {
  const [board, setBoard] = useState(null)
  const [columns, setColumns] = useState([])
  const [tasks, setTasks] = useState([])
  const [values, setValues] = useState({}) // { [taskId]: { [columnId]: value } }
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!boardId) return
    const { data: b } = await supabase
      .from('boards')
      .select('*, workspaces(id, name, color, icon)')
      .eq('id', boardId)
      .single()
    if (!b) { setLoading(false); return }
    setBoard(b)

    const [{ data: cols }, { data: tks }, { data: vals }, { data: mem }] = await Promise.all([
      supabase.from('board_columns').select('*').eq('board_id', boardId).order('position'),
      supabase.from('tasks').select('*').eq('board_id', boardId).order('position'),
      supabase.from('task_values').select('*').eq('board_id', boardId),
      supabase.from('workspace_members')
        .select('profiles(id, full_name, email, avatar_url)')
        .eq('workspace_id', b.workspace_id),
    ])
    setColumns(cols || [])
    setTasks(tks || [])

    // Sembrar la columna "Marca" (tag) con el nombre del workspace si aún no
    // tiene opciones, para que quede "linkeada" al workspace pero editable.
    const marca = (cols || []).find(c => c.type === 'tag' && c.name === 'Marca' && (!c.options || c.options.length === 0))
    if (marca && b.workspaces?.name) {
      const seeded = [{ id: 'ws', label: b.workspaces.name, color: b.workspaces.color || '#290880' }]
      setColumns(cs => cs.map(c => (c.id === marca.id ? { ...c, options: seeded } : c)))
      supabase.from('board_columns').update({ options: seeded }).eq('id', marca.id)
    }
    const map = {}
    for (const v of vals || []) {
      if (!map[v.task_id]) map[v.task_id] = {}
      map[v.task_id][v.column_id] = v.value
    }
    setValues(map)
    setMembers((mem || []).map(m => m.profiles).filter(Boolean))
    setLoading(false)
  }, [boardId])

  useEffect(() => { setLoading(true); fetchAll() }, [fetchAll])

  // Realtime: cambios de otros usuarios
  useEffect(() => {
    if (!boardId) return
    const channel = supabase.channel(`board-${boardId}-${Math.random().toString(36).slice(2)}`)
    channel
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `board_id=eq.${boardId}` },
        (payload) => {
          setTasks(prev => {
            if (payload.eventType === 'INSERT') {
              if (prev.some(t => t.id === payload.new.id)) return prev
              return [...prev, payload.new].sort((a, b) => a.position - b.position)
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(t => (t.id === payload.new.id ? payload.new : t))
                .sort((a, b) => a.position - b.position)
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(t => t.id !== payload.old.id)
            }
            return prev
          })
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'task_values', filter: `board_id=eq.${boardId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') return
          const v = payload.new
          setValues(prev => ({
            ...prev,
            [v.task_id]: { ...(prev[v.task_id] || {}), [v.column_id]: v.value },
          }))
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [boardId])

  // ---------- Mutaciones ----------

  const createTask = async (title, parentTaskId = null, extraValues = {}) => {
    const siblings = tasks.filter(t => (t.parent_task_id || null) === parentTaskId)
    const position = siblings.length ? Math.max(...siblings.map(t => t.position)) + 1 : 1
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('tasks')
      .insert({ board_id: boardId, title, parent_task_id: parentTaskId, position, created_by: user?.id })
      .select()
      .single()
    if (error) throw error
    setTasks(prev => prev.some(t => t.id === data.id) ? prev : [...prev, data])
    for (const [columnId, value] of Object.entries(extraValues)) {
      await setValue(data.id, columnId, value)
    }
    return data
  }

  const updateTask = async (taskId, patch) => {
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, ...patch } : t)))
    const { error } = await supabase.from('tasks').update(patch).eq('id', taskId)
    if (error) { fetchAll(); throw error }
  }

  const addColumn = async ({ name, type, multi = false }) => {
    const position = columns.length ? Math.max(...columns.map(c => c.position)) + 1 : 1
    let base = []
    if (type === 'status') base = DEFAULT_STATUS_OPTIONS
    if (type === 'priority') base = PRIORITY_OPTIONS
    const options = buildOptions(base, multi)
    const { data, error } = await supabase
      .from('board_columns')
      .insert({ board_id: boardId, name, type, options, position })
      .select()
      .single()
    if (error) throw error
    setColumns(c => [...c, data])
    return data
  }

  const updateBoardMeta = async (patch) => {
    setBoard(b => ({ ...b, ...patch }))
    const { error } = await supabase.from('boards').update(patch).eq('id', boardId)
    if (error) { fetchAll(); throw error }
    window.dispatchEvent(new CustomEvent('boards-changed'))
  }

  const updateColumn = async (columnId, patch) => {
    setColumns(cs => cs.map(c => (c.id === columnId ? { ...c, ...patch } : c)))
    const { error } = await supabase.from('board_columns').update(patch).eq('id', columnId)
    if (error) { fetchAll(); throw error }
  }

  const deleteColumn = async (columnId) => {
    setColumns(cs => cs.filter(c => c.id !== columnId))
    const { error } = await supabase.from('board_columns').delete().eq('id', columnId)
    if (error) { fetchAll(); throw error }
  }

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId && t.parent_task_id !== taskId))
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) { fetchAll(); throw error }
  }

  const deleteTasks = async (ids) => {
    const set = new Set(ids)
    setTasks(prev => prev.filter(t => !set.has(t.id) && !set.has(t.parent_task_id)))
    const { error } = await supabase.from('tasks').delete().in('id', ids)
    if (error) { fetchAll(); throw error }
  }

  const bulkSetValue = async (taskIds, columnId, value) => {
    setValues(prev => {
      const next = { ...prev }
      for (const id of taskIds) next[id] = { ...(next[id] || {}), [columnId]: value }
      return next
    })
    const rows = taskIds.map(id => ({
      task_id: id, column_id: columnId, board_id: boardId, value, updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase.from('task_values').upsert(rows, { onConflict: 'task_id,column_id' })
    if (error) { fetchAll(); throw error }
  }

  const setValue = async (taskId, columnId, value) => {
    setValues(prev => ({
      ...prev,
      [taskId]: { ...(prev[taskId] || {}), [columnId]: value },
    }))
    const { error } = await supabase
      .from('task_values')
      .upsert(
        { task_id: taskId, column_id: columnId, board_id: boardId, value, updated_at: new Date().toISOString() },
        { onConflict: 'task_id,column_id' }
      )
    if (error) { fetchAll(); throw error }
  }

  const topTasks = useMemo(
    () => tasks.filter(t => !t.parent_task_id).sort((a, b) => a.position - b.position),
    [tasks]
  )
  const subtasksOf = useCallback(
    (taskId) => tasks.filter(t => t.parent_task_id === taskId).sort((a, b) => a.position - b.position),
    [tasks]
  )

  return {
    board, columns, tasks, topTasks, subtasksOf, values, members, loading,
    createTask, updateTask, deleteTask, deleteTasks, setValue, bulkSetValue,
    addColumn, updateColumn, deleteColumn, updateBoardMeta, refetch: fetchAll,
  }
}
