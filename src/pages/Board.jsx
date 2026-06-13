import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Table2, Kanban as KanbanIcon, CalendarDays, Trash2, CircleDot } from 'lucide-react'
import { useBoard } from '../hooks/useBoard'
import { useIsMobile } from '../hooks/useIsMobile'
import { TableView, CardsView } from '../components/TableView'
import { KanbanView } from '../components/KanbanView'
import { CalendarView } from '../components/CalendarView'
import { TaskDetail } from '../components/TaskDetail'
import { AddColumnModal, ColumnOptionsEditor } from '../components/ColumnModals'
import { BulkBar } from '../components/BulkBar'
import { OptionSheet, WorkspaceIcon } from '../components/ui'
import { IconPickerModal } from '../components/IconEmojiPicker'

export default function Board() {
  const { id } = useParams()
  const board = useBoard(id)
  const [view, setView] = useState(() => localStorage.getItem(`view-${id}`) || 'table')
  const [openTask, setOpenTask] = useState(null)
  const [editingColumn, setEditingColumn] = useState(null)
  const [addingColumn, setAddingColumn] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [statusPicker, setStatusPicker] = useState(false)
  const [editIcon, setEditIcon] = useState(false)
  const [panelWidth, setPanelWidth] = useState(() => {
    const v = parseInt(localStorage.getItem('task-panel-width') || '', 10)
    return Number.isFinite(v) ? Math.min(820, Math.max(360, v)) : 460
  })
  const isMobile = useIsMobile()

  const resizePanel = (w) => {
    const clamped = Math.min(820, Math.max(360, w))
    setPanelWidth(clamped)
    localStorage.setItem('task-panel-width', String(clamped))
  }

  const toggleSelect = (tid) => setSelectedIds(s => (s.includes(tid) ? s.filter(x => x !== tid) : [...s, tid]))
  const clearSel = () => setSelectedIds([])
  const statusCol = useMemo(() => board.columns.find(c => c.type === 'status'), [board.columns])

  useEffect(() => { setSelectedIds([]) }, [view, id])

  useEffect(() => { localStorage.setItem(`view-${id}`, view) }, [view, id])

  // Botón "+" del bottom nav en móvil: enfoca el campo inline de nueva tarea
  useEffect(() => {
    const h = () => {
      const el = document.querySelector('[data-new-task]')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => el.focus(), 250)
      }
    }
    window.addEventListener('quick-create-task', h)
    return () => window.removeEventListener('quick-create-task', h)
  }, [])

  // Mantener el task abierto sincronizado con datos en vivo
  const liveTask = useMemo(
    () => (openTask ? board.tasks.find(t => t.id === openTask.id) || null : null),
    [openTask, board.tasks]
  )

  if (board.loading) return <div className="p-8 text-sm text-2">Cargando board…</div>
  if (!board.board) return <div className="p-8 text-sm text-2">Board no encontrado.</div>

  const ws = board.board.workspaces

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto transition-[padding] duration-150"
      style={{ paddingRight: openTask && !isMobile ? panelWidth + 24 : undefined }}>
      <div className="flex items-center gap-2.5 mb-4">
        <Link to={`/workspace/${ws?.id}`} aria-label="Volver al workspace"
          className="p-1.5 rounded-full surface border hairline text-2">
          <ChevronLeft size={17} />
        </Link>
        <button onClick={() => setEditIcon(true)} aria-label="Cambiar icono del board"
          className="active:scale-95 transition-transform shrink-0">
          <WorkspaceIcon icon={board.board.icon || '📋'} color={ws?.color || '#290880'} size={36} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate leading-tight">{board.board.name}</h1>
          <p className="text-[11px] text-2 truncate">{ws?.name}</p>
        </div>
        <div className="flex surface-2 rounded-full p-1 gap-0.5">
          <button onClick={() => setView('table')} aria-label="Vista tabla"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${view === 'table' ? 'bg-brand text-white' : 'text-2'}`}>
            <Table2 size={13} /> <span className="hidden sm:inline">Tabla</span>
          </button>
          <button onClick={() => setView('kanban')} aria-label="Vista kanban"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${view === 'kanban' ? 'bg-brand text-white' : 'text-2'}`}>
            <KanbanIcon size={13} /> <span className="hidden sm:inline">Kanban</span>
          </button>
          <button onClick={() => setView('calendar')} aria-label="Vista calendario"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${view === 'calendar' ? 'bg-brand text-white' : 'text-2'}`}>
            <CalendarDays size={13} /> <span className="hidden sm:inline">Calendario</span>
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <KanbanView {...board} onOpenTask={setOpenTask} onEditColumn={setEditingColumn} />
      ) : view === 'calendar' ? (
        <CalendarView {...board} onOpenTask={setOpenTask} isMobile={isMobile} />
      ) : isMobile ? (
        <CardsView {...board} onOpenTask={setOpenTask} onEditColumn={setEditingColumn}
          selectedIds={selectedIds} onToggleSelect={toggleSelect} />
      ) : (
        <TableView {...board} onOpenTask={setOpenTask}
          onEditColumn={setEditingColumn} onAddColumn={() => setAddingColumn(true)}
          selectedIds={selectedIds} onToggleSelect={toggleSelect} onSelectAll={setSelectedIds} />
      )}

      {view !== 'calendar' && (
        <BulkBar count={selectedIds.length} onClear={clearSel}>
          {statusCol && (
            <button onClick={() => setStatusPicker(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full surface-2">
              <CircleDot size={14} /> Estado
            </button>
          )}
          <button onClick={async () => {
              if (!window.confirm(`¿Eliminar ${selectedIds.length} tarea(s)?`)) return
              await board.deleteTasks(selectedIds); clearSel()
            }}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full surface-2 text-[#E2445C]">
            <Trash2 size={14} /> Eliminar
          </button>
        </BulkBar>
      )}

      <OptionSheet open={statusPicker} onClose={() => setStatusPicker(false)}
        title="Cambiar estado" options={statusCol?.options || []} value={null}
        onSelect={async (optId) => {
          await board.bulkSetValue(selectedIds, statusCol.id, optId); clearSel()
        }} />

      <TaskDetail task={liveTask} board={board.board} columns={board.columns}
        values={board.values} members={board.members} subtasksOf={board.subtasksOf}
        createTask={board.createTask} updateTask={board.updateTask}
        deleteTask={board.deleteTask} setValue={board.setValue}
        onEditColumn={setEditingColumn} isMobile={isMobile}
        width={panelWidth} onResize={resizePanel}
        onClose={() => setOpenTask(null)} />

      <AddColumnModal open={addingColumn} onClose={() => setAddingColumn(false)}
        addColumn={board.addColumn} />
      <ColumnOptionsEditor column={editingColumn} onClose={() => setEditingColumn(null)}
        updateColumn={board.updateColumn} deleteColumn={board.deleteColumn} />
      <IconPickerModal open={editIcon} onClose={() => setEditIcon(false)}
        title="Icono del board" value={board.board.icon || '📋'} color={ws?.color || '#290880'}
        onSave={(patch) => board.updateBoardMeta(patch)} />
    </div>
  )
}
