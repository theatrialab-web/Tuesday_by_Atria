import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Search, CheckSquare, LayoutGrid, CircleDot, CornerDownLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { WorkspaceIcon } from './ui'

export function CommandPalette({ open, onClose, onOpenTask }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [active, setActive] = useState(0)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)
  const seqRef = useRef(0)

  useEffect(() => {
    if (open) { setQ(''); setResults([]); setActive(0); setTimeout(() => inputRef.current?.focus(), 30) }
  }, [open])

  // Busqueda con debounce en tareas, boards y workspaces
  useEffect(() => {
    if (!open) return
    const term = q.trim()
    if (term.length < 2) { setResults([]); setSearching(false); return }
    setSearching(true)
    const seq = ++seqRef.current
    const t = setTimeout(async () => {
      const like = `%${term}%`
      const [tasks, boards, workspaces] = await Promise.all([
        supabase.from('tasks').select('id, title, board_id, boards(name, icon, color)').ilike('title', like).limit(12),
        supabase.from('boards').select('id, name, icon, color').ilike('name', like).limit(5),
        supabase.from('workspaces').select('id, name, icon, color').ilike('name', like).limit(5),
      ])
      if (seq !== seqRef.current) return // llego tarde, descartar
      const items = [
        ...(workspaces.data || []).map(w => ({ kind: 'workspace', id: w.id, label: w.name, icon: w.icon, color: w.color })),
        ...(boards.data || []).map(b => ({ kind: 'board', id: b.id, label: b.name, icon: b.icon, color: b.color })),
        ...(tasks.data || []).map(t2 => ({ kind: 'task', id: t2.id, boardId: t2.board_id, label: t2.title, sub: t2.boards?.name, icon: t2.boards?.icon, color: t2.boards?.color })),
      ]
      setResults(items)
      setActive(0)
      setSearching(false)
    }, 250)
    return () => clearTimeout(t)
  }, [q, open])

  const pick = (r) => {
    onClose()
    if (r.kind === 'task') onOpenTask({ taskId: r.id, boardId: r.boardId })
    else if (r.kind === 'board') navigate(`/board/${r.id}`)
    else navigate(`/workspace/${r.id}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]) }
    else if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  const KIND = {
    task: { icon: CheckSquare, label: 'Tarea' },
    board: { icon: LayoutGrid, label: 'Board' },
    workspace: { icon: CircleDot, label: 'Workspace' },
  }

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12dvh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/35 anim-fade" />
      <div className="relative glass-strong border hairline rounded-ios w-full max-w-xl anim-pop overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b hairline">
          <Search size={17} className="text-2 shrink-0" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
            placeholder="Buscar tareas, boards y workspaces…"
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-2" />
          <kbd className="hidden sm:block text-[10px] text-2 surface-2 rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-[50dvh] overflow-y-auto">
          {q.trim().length < 2 ? (
            <p className="text-sm text-2 px-4 py-6 text-center">Escribe al menos 2 letras. Abre con Ctrl+K (⌘K en Mac).</p>
          ) : searching && results.length === 0 ? (
            <p className="text-sm text-2 px-4 py-6 text-center">Buscando…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-2 px-4 py-6 text-center">Sin resultados para «{q.trim()}».</p>
          ) : (
            results.map((r, i) => {
              const K = KIND[r.kind]
              return (
                <button key={`${r.kind}-${r.id}`} onClick={() => pick(r)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === active ? 'surface-2' : ''}`}>
                  <WorkspaceIcon icon={r.icon || '📋'} color={r.color || '#E4E4E9'} size={26} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-[11px] text-2">{K.label}{r.sub ? ` · ${r.sub}` : ''}</p>
                  </div>
                  {i === active && <CornerDownLeft size={13} className="text-2 shrink-0" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
