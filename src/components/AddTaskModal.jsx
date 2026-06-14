import { useEffect, useState } from 'react'
import { Modal, WorkspaceIcon } from './ui'
import { supabase } from '../lib/supabase'
import { fromDateStr } from '../lib/calendar'
import { useAuth } from '../contexts/AuthContext'

export function AddTaskModal({ open, onClose, onCreated, initialDate = null }) {
  const { user } = useAuth()
  const [boards, setBoards] = useState([])
  const [boardId, setBoardId] = useState('')
  const [title, setTitle] = useState('')
  const [assignSelf, setAssignSelf] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    setTitle(''); setError(null)
    supabase.from('boards')
      .select('id, name, icon, color, workspaces(name, color)')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setBoards(data || [])
        if (data?.length && !boardId) setBoardId(data[0].id)
      })
  }, [open])

  const submit = async () => {
    if (!title.trim() || !boardId || busy) return
    setBusy(true); setError(null)
    try {
      const { data: task, error: tErr } = await supabase.from('tasks')
        .insert({ board_id: boardId, title: title.trim(), created_by: user.id, position: Date.now() })
        .select().single()
      if (tErr) throw tErr

      if (assignSelf) {
        const { data: personCol } = await supabase.from('board_columns')
          .select('id').eq('board_id', boardId).eq('type', 'person').limit(1).maybeSingle()
        if (personCol) {
          await supabase.from('task_values').upsert(
            { task_id: task.id, column_id: personCol.id, board_id: boardId, value: [user.id], updated_at: new Date().toISOString() },
            { onConflict: 'task_id,column_id' }
          )
        }
      }
      if (initialDate) {
        const { data: dateCol } = await supabase.from('board_columns')
          .select('id').eq('board_id', boardId).eq('type', 'date').limit(1).maybeSingle()
        if (dateCol) {
          await supabase.from('task_values').upsert(
            { task_id: task.id, column_id: dateCol.id, board_id: boardId, value: initialDate, updated_at: new Date().toISOString() },
            { onConflict: 'task_id,column_id' }
          )
        }
      }
      setTitle('')
      onCreated?.()
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo crear la tarea')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={initialDate ? 'Nueva tarea con fecha' : 'Nueva tarea'}>
      <div className="flex flex-col gap-4">
        <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="¿Qué hay que hacer?"
          className="w-full text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />

        {initialDate && (
          <span className="self-start text-xs font-medium px-2.5 py-1 rounded-full bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white">
            📅 {fromDateStr(initialDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Board</label>
          {boards.length === 0 ? (
            <p className="text-sm text-2 mt-1">No tienes boards. Crea uno primero desde un workspace.</p>
          ) : (
            <div className="mt-2 flex flex-col gap-1.5 max-h-52 overflow-y-auto">
              {boards.map(b => (
                <button key={b.id} onClick={() => setBoardId(b.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-ios-sm text-left ${boardId === b.id ? 'bg-brand-soft dark:bg-brand-softDark ring-1 ring-brand-light' : 'surface-2'}`}>
                  <WorkspaceIcon icon={b.icon || '📋'} color={b.color || '#E4E4E9'} size={28} />
                  <span className="min-w-0">
                    <span className="text-sm font-medium block truncate">{b.name}</span>
                    <span className="text-[11px] text-2 block truncate">{b.workspaces?.name}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-ios-sm surface-2 cursor-pointer">
          <span className="text-sm font-medium">Asignármela a mí</span>
          <input type="checkbox" checked={assignSelf} onChange={e => setAssignSelf(e.target.checked)}
            className="w-4 h-4 rounded accent-brand" />
        </label>

        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!title.trim() || !boardId || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear tarea'}
        </button>
      </div>
    </Modal>
  )
}
