import { useBoard } from '../hooks/useBoard'
import { useIsMobile } from '../hooks/useIsMobile'
import { TaskDetail } from './TaskDetail'

// Abre el panel de una sola tarea sin mostrar el board completo.
// Carga el contexto del board (columnas, valores, miembros) en segundo plano.
export function TaskQuickView({ taskId, boardId, onClose, onChanged }) {
  const board = useBoard(boardId)
  const isMobile = useIsMobile()
  const task = board.tasks.find(t => t.id === taskId) || null

  const wrap = (fn) => async (...args) => { const r = await fn(...args); onChanged?.(); return r }

  return (
    <TaskDetail task={task} board={board.board} columns={board.columns}
      values={board.values} members={board.members} subtasksOf={board.subtasksOf}
      createTask={board.createTask} updateTask={wrap(board.updateTask)}
      deleteTask={wrap(board.deleteTask)} setValue={wrap(board.setValue)}
      isMobile={isMobile} onClose={onClose} />
  )
}
