import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { WORKSPACE_COLORS, colOptions } from '../lib/constants'

// Tareas (de primer nivel) de todos los boards del workspace, normalizadas:
// título, board, estado, personas, fecha. Para la tabla y el calendario
// a nivel workspace.
export function useWorkspaceTasks(workspaceId) {
  const [tasks, setTasks] = useState([])
  const [boards, setBoards] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)

    const { data: bs } = await supabase
      .from('boards').select('id, name').eq('workspace_id', workspaceId).order('position')
    const boardList = bs || []
    const boardIds = boardList.map(b => b.id)
    const colorOf = {}
    boardList.forEach((b, i) => { colorOf[b.id] = WORKSPACE_COLORS[i % WORKSPACE_COLORS.length] })

    if (boardIds.length === 0) {
      setBoards([]); setTasks([]); setMembers([]); setLoading(false); return
    }

    const [{ data: tks }, { data: cols }, { data: vals }, { data: mem }] = await Promise.all([
      supabase.from('tasks').select('id, title, board_id, completed, parent_task_id')
        .in('board_id', boardIds).is('parent_task_id', null).order('position'),
      supabase.from('board_columns').select('id, board_id, type, options')
        .in('board_id', boardIds).in('type', ['status', 'person', 'date']),
      supabase.from('task_values').select('task_id, column_id, value').in('board_id', boardIds),
      supabase.from('workspace_members')
        .select('profiles(id, full_name, email, avatar_url)').eq('workspace_id', workspaceId),
    ])

    // Mapas auxiliares
    const colByBoard = {} // boardId -> { status, person, date }
    for (const c of cols || []) {
      if (!colByBoard[c.board_id]) colByBoard[c.board_id] = {}
      colByBoard[c.board_id][c.type] = c
    }
    const valByTask = {} // taskId -> { columnId: value }
    for (const v of vals || []) {
      if (!valByTask[v.task_id]) valByTask[v.task_id] = {}
      valByTask[v.task_id][v.column_id] = v.value
    }

    const rows = (tks || []).map(t => {
      const bcols = colByBoard[t.board_id] || {}
      const tvals = valByTask[t.id] || {}
      const statusCol = bcols.status
      const statusVal = statusCol ? tvals[statusCol.id] : null
      const statusKey = Array.isArray(statusVal) ? statusVal[0] : statusVal
      const sOpts = statusCol ? colOptions(statusCol) : []
      const statusOpt = sOpts.find(o => o.id === statusKey) || null
      const personCol = bcols.person
      const assignees = personCol && Array.isArray(tvals[personCol.id]) ? tvals[personCol.id] : []
      const dateCol = bcols.date
      const date = dateCol ? tvals[dateCol.id] : null
      const board = boardList.find(b => b.id === t.board_id)
      return {
        id: t.id,
        title: t.title,
        completed: t.completed,
        boardId: t.board_id,
        boardName: board?.name || '',
        boardColor: colorOf[t.board_id],
        boardIcon: board?.icon || null,
        statusColId: statusCol?.id || null,
        statusOptions: sOpts,
        statusValue: statusVal ?? null,
        statusOption: statusOpt || null,
        assignees,
        date: typeof date === 'string' ? date : null,
      }
    })

    setBoards(boardList)
    setMembers((mem || []).map(m => m.profiles).filter(Boolean))
    setTasks(rows)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const setStatus = async (row, optId) => {
    if (!row.statusColId) return
    setTasks(ts => ts.map(t => (t.id === row.id
      ? { ...t, statusValue: optId, statusOption: (t.statusOptions || []).find(o => o.id === optId) || null }
      : t)))
    await supabase.from('task_values').upsert(
      { task_id: row.id, column_id: row.statusColId, board_id: row.boardId, value: optId, updated_at: new Date().toISOString() },
      { onConflict: 'task_id,column_id' }
    )
  }

  const deleteTasks = async (ids) => {
    const set = new Set(ids)
    setTasks(ts => ts.filter(t => !set.has(t.id)))
    await supabase.from('tasks').delete().in('id', ids)
  }

  return { tasks, boards, members, loading, setStatus, deleteTasks, refetch: fetchAll }
}
