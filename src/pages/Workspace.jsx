import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList, Plus, Users, Trash2, LayoutGrid, Table2, CalendarDays, CircleDot, Pencil, CreditCard, Video } from 'lucide-react'
import { useWorkspace, useWorkspaces } from '../hooks/useWorkspaces'
import { useBoards } from '../hooks/useBoards'
import { useWorkspaceTasks } from '../hooks/useWorkspaceTasks'
import { useIsMobile } from '../hooks/useIsMobile'
import { useAuth } from '../contexts/AuthContext'
import { WorkspaceIcon, Avatar, OptionSheet } from '../components/ui'
import { CreateBoardModal, MembersModal } from '../components/CreateModals'
import { IconPickerModal } from '../components/IconEmojiPicker'
import { BillingView } from '../components/BillingView'
import { MeetingsView } from '../components/MeetingsView'
import { WorkspaceTable } from '../components/WorkspaceTable'
import { MonthCalendar } from '../components/MonthCalendar'
import { TaskQuickView } from '../components/TaskQuickView'
import { BulkBar } from '../components/BulkBar'

export default function Workspace() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { workspace, members, inviteByEmail, removeMember } = useWorkspace(id)
  const { deleteWorkspace, updateWorkspace } = useWorkspaces()
  const { boards, loading, createBoard, updateBoard, deleteBoards } = useBoards(id)
  const wsTasks = useWorkspaceTasks(id)

  const [view, setView] = useState(() => localStorage.getItem(`ws-view-${id}`) || 'boards')
  const [createOpen, setCreateOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [selBoards, setSelBoards] = useState([])
  const [selTasks, setSelTasks] = useState([])
  const [statusPicker, setStatusPicker] = useState(false)
  const [editWsIcon, setEditWsIcon] = useState(false)
  const [editBoard, setEditBoard] = useState(null)
  const [editingName, setEditingName] = useState(false)
  const [quick, setQuick] = useState(null)

  useEffect(() => { localStorage.setItem(`ws-view-${id}`, view) }, [view, id])
  useEffect(() => { setSelBoards([]); setSelTasks([]) }, [view, id])

  useEffect(() => {
    const h = () => setCreateOpen(true)
    window.addEventListener('quick-create-board', h)
    return () => window.removeEventListener('quick-create-board', h)
  }, [])

  const isOwner = workspace && user && workspace.owner_id === user.id
  const toggleBoard = (bid) => setSelBoards(s => (s.includes(bid) ? s.filter(x => x !== bid) : [...s, bid]))
  const toggleTask = (tid) => setSelTasks(s => (s.includes(tid) ? s.filter(x => x !== tid) : [...s, tid]))

  // Para el selector de estado masivo de tareas: agrupa por board, ya que
  // cada board tiene su propia columna de estado.
  const statusOptionsUnion = useMemo(() => {
    const seen = new Map()
    for (const t of wsTasks.tasks) for (const o of t.statusOptions || []) if (!seen.has(o.label)) seen.set(o.label, o)
    return [...seen.values()]
  }, [wsTasks.tasks])

  const eventsByDate = useMemo(() => {
    const map = {}
    for (const t of wsTasks.tasks) {
      if (!t.date) continue
      if (!map[t.date]) map[t.date] = []
      map[t.date].push({ key: t.id, title: t.title, color: t.boardColor, subtitle: t.boardName, boardId: t.boardId })
    }
    return map
  }, [wsTasks.tasks])

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar el workspace "${workspace.name}"? Se borrarán todos sus boards, tareas y archivos. Esto no se puede deshacer.`)) return
    try { await deleteWorkspace(id); navigate('/') }
    catch (e) { window.alert('No se pudo eliminar: ' + (e.message || 'error')) }
  }

  if (!workspace) return <div className="p-8 text-sm text-2">Cargando…</div>

  const tab = (key, label, Icon) => (
    <button onClick={() => setView(key)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${view === key ? 'bg-brand text-white' : 'text-2'}`}>
      <Icon size={13} /> <span className="hidden sm:inline">{label}</span>
    </button>
  )

  return (
    <div className="p-5 sm:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={() => setEditWsIcon(true)} aria-label="Cambiar icono del workspace"
            className="active:scale-95 transition-transform shrink-0">
            <WorkspaceIcon icon={workspace.icon} color={workspace.color} size={46} />
          </button>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <input autoFocus defaultValue={workspace.name}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== workspace.name) updateWorkspace(id, { name: v }); setEditingName(false) }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditingName(false) }}
                className="text-xl font-semibold bg-transparent border-b border-brand-light outline-none w-full" />
            ) : (
              <div className="flex items-start gap-1.5">
                <h1 onClick={() => setEditingName(true)} title="Clic para renombrar"
                  className="text-xl font-semibold leading-tight line-clamp-2 break-words cursor-text min-w-0">
                  {workspace.name}
                </h1>
                <button onClick={() => setEditingName(true)} aria-label="Renombrar"
                  className="mt-1 text-2 opacity-50 hover:opacity-100 shrink-0"><Pencil size={13} /></button>
              </div>
            )}
            <p className="text-xs text-2">{boards.length} boards · {members.length} miembros</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setMembersOpen(true)} aria-label="Miembros"
            className="flex items-center gap-1.5 px-3 py-2 rounded-ios-sm surface border hairline text-sm font-medium">
            <div className="flex -space-x-1.5">
              {members.slice(0, 3).map(m => <Avatar key={m.id} profile={m} size={22} />)}
            </div>
            <Users size={15} className="text-2" />
          </button>
          {isOwner && (
            <button onClick={handleDelete} aria-label="Eliminar workspace"
              className="p-2 rounded-ios-sm surface border hairline text-2 hover:text-[#E2445C]">
              <Trash2 size={16} />
            </button>
          )}
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold active:scale-95 transition-transform">
            <Plus size={15} /> <span className="hidden sm:inline">Nuevo board</span>
          </button>
        </div>
      </div>

      <div className="flex surface-2 rounded-full p-1 gap-0.5 w-fit mb-5 max-w-full overflow-x-auto">
        {tab('boards', 'Boards', LayoutGrid)}
        {tab('table', 'Tabla', Table2)}
        {tab('calendar', 'Calendario', CalendarDays)}
        {tab('billing', 'Pagos', CreditCard)}
        {tab('meetings', 'Reuniones', Video)}
      </div>

      {view === 'billing' && <BillingView workspaceId={id} />}
      {view === 'meetings' && <MeetingsView workspaceId={id} />}

      {view === 'boards' && (
        loading ? (
          <p className="text-sm text-2">Cargando…</p>
        ) : boards.length === 0 ? (
          <div className="rounded-ios border-2 border-dashed hairline p-10 flex flex-col items-center gap-3 text-2">
            <ClipboardList size={28} />
            <p className="text-sm">Aún no hay boards. Crea el primero para empezar a organizar tareas.</p>
            <button onClick={() => setCreateOpen(true)}
              className="px-4 py-2 rounded-ios-sm bg-brand text-white text-sm font-semibold">Crear board</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boards.map(b => {
              const checked = selBoards.includes(b.id)
              return (
                <div key={b.id}
                  className={`surface rounded-ios border hairline p-5 flex items-center gap-3 ${checked ? 'ring-2 ring-brand' : ''}`}>
                  <input type="checkbox" checked={checked}
                    onChange={() => toggleBoard(b.id)}
                    className="w-4 h-4 rounded accent-brand shrink-0" aria-label="Seleccionar board" />
                  <button onClick={(e) => { e.stopPropagation(); setEditBoard(b) }}
                    aria-label="Cambiar icono del board" className="shrink-0 active:scale-95 transition-transform">
                    <WorkspaceIcon icon={b.icon || '📋'} color={b.color || '#E4E4E9'} size={40} />
                  </button>
                  <button onClick={() => navigate(`/board/${b.id}`)}
                    className="flex-1 min-w-0 text-left active:scale-[.98] transition-transform">
                    <span className="font-semibold text-sm line-clamp-2 break-words block">{b.name}</span>
                  </button>
                </div>
              )
            })}
          </div>
        )
      )}

      {view === 'table' && (
        wsTasks.loading ? <p className="text-sm text-2">Cargando…</p> : (
          <WorkspaceTable tasks={wsTasks.tasks} members={wsTasks.members}
            onSetStatus={wsTasks.setStatus}
            onOpenTask={(t) => setQuick({ taskId: t.id, boardId: t.boardId })}
            onOpenBoard={(bid) => navigate(`/board/${bid}`)}
            selectedIds={selTasks} onToggleSelect={toggleTask} onSelectAll={setSelTasks} />
        )
      )}

      {view === 'calendar' && (
        wsTasks.loading ? <p className="text-sm text-2">Cargando…</p> : (
          <MonthCalendar eventsByDate={eventsByDate} isMobile={isMobile}
            onEventClick={(ev) => ev.boardId && ev.key && setQuick({ taskId: ev.key, boardId: ev.boardId })}
            emptyHint={<p className="text-sm text-2 mt-4">No hay tareas con fecha en este workspace.</p>} />
        )
      )}

      {/* Acciones masivas */}
      {view === 'boards' && (
        <BulkBar count={selBoards.length} onClear={() => setSelBoards([])}>
          <button onClick={async () => {
              if (!window.confirm(`¿Eliminar ${selBoards.length} board(s) y todas sus tareas?`)) return
              await deleteBoards(selBoards); setSelBoards([]); wsTasks.refetch()
            }}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full surface-2 text-[#E2445C]">
            <Trash2 size={14} /> Eliminar
          </button>
        </BulkBar>
      )}
      {view === 'table' && (
        <BulkBar count={selTasks.length} onClear={() => setSelTasks([])}>
          {statusOptionsUnion.length > 0 && (
            <button onClick={() => setStatusPicker(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full surface-2">
              <CircleDot size={14} /> Estado
            </button>
          )}
          <button onClick={async () => {
              if (!window.confirm(`¿Eliminar ${selTasks.length} tarea(s)?`)) return
              await wsTasks.deleteTasks(selTasks); setSelTasks([])
            }}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full surface-2 text-[#E2445C]">
            <Trash2 size={14} /> Eliminar
          </button>
        </BulkBar>
      )}

      <OptionSheet open={statusPicker} onClose={() => setStatusPicker(false)}
        title="Cambiar estado" options={statusOptionsUnion} value={null}
        onSelect={async (optId) => {
          const opt = statusOptionsUnion.find(o => o.id === optId)
          for (const tid of selTasks) {
            const row = wsTasks.tasks.find(t => t.id === tid)
            if (!row) continue
            const match = (row.statusOptions || []).find(o => o.label === opt?.label) || (opt ? { id: optId } : null)
            await wsTasks.setStatus(row, match ? match.id : optId)
          }
          setSelTasks([])
        }} />

      <CreateBoardModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreate={async (name, icon) => { const b = await createBoard(name, icon); navigate(`/board/${b.id}`) }} />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)}
        members={members} inviteByEmail={inviteByEmail} removeMember={removeMember} />
      <IconPickerModal open={editWsIcon} onClose={() => setEditWsIcon(false)}
        title="Icono del workspace" value={workspace.icon} color={workspace.color} withColor
        onSave={(patch) => updateWorkspace(id, patch)} />
      <IconPickerModal open={!!editBoard} onClose={() => setEditBoard(null)}
        title="Icono y color del board" value={editBoard?.icon || '📋'} color={editBoard?.color || '#E4E4E9'} withColor
        onSave={(patch) => updateBoard(editBoard.id, patch)} />

      {quick && (
        <TaskQuickView taskId={quick.taskId} boardId={quick.boardId}
          onClose={() => setQuick(null)} onChanged={wsTasks.refetch} />
      )}
    </div>
  )
}
