export const DEFAULT_ICON_COLOR = '#E4E4E9' // gris claro

export const WORKSPACE_COLORS = [
  '#E4E4E9', '#290880', '#E2445C', '#00C875',
  '#FDAB3D', '#0086C0', '#A25DDC', '#FF642E',
]

export const WORKSPACE_ICONS = [
  'briefcase', 'rocket', 'star', 'heart',
  'zap', 'globe', 'palette', 'shopping-bag',
]

export const DEFAULT_STATUS_OPTIONS = [
  { id: 'pending', label: 'Pendiente', color: '#9A9AA6' },
  { id: 'working', label: 'En progreso', color: '#FDAB3D' },
  { id: 'stuck', label: 'Detenido', color: '#E2445C' },
  { id: 'done', label: 'Hecho', color: '#00C875' },
]

export const PRIORITY_OPTIONS = [
  { id: 'alta', label: 'Alta', color: '#E2445C' },
  { id: 'media', label: 'Media', color: '#FDAB3D' },
  { id: 'baja', label: 'Baja', color: '#00C875' },
]

export const DEFAULT_COLUMNS = [
  { name: 'Estado', type: 'status', position: 1, options: DEFAULT_STATUS_OPTIONS },
  { name: 'Persona', type: 'person', position: 2, options: [] },
  { name: 'Fecha', type: 'date', position: 3, options: [] },
  { name: 'Marca', type: 'tag', position: 4, options: [] },
  { name: 'Urgencia', type: 'priority', position: 5, options: PRIORITY_OPTIONS },
]

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
}

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export function dateGroup(iso) {
  if (!iso) return 'sin_fecha'
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(iso + 'T00:00:00')
  if (d < today) return 'vencidas'
  if (d.getTime() === today.getTime()) return 'hoy'
  return 'proximamente'
}

// --- Multi-selección guardada dentro de options (sin columna nueva en la BD) ---
// La config se guarda como un elemento { _cfg: true, multi: bool } al inicio
// del array options; las opciones reales se filtran con colOptions().
export function colOptions(col) {
  return (col?.options || []).filter(o => o && !o._cfg)
}

export function colMulti(col) {
  if (col?.multi) return true // por si existe la columna en la BD
  return (col?.options || []).some(o => o && o._cfg && o.multi)
}

export function buildOptions(options, multi) {
  const clean = (options || []).filter(o => o && !o._cfg)
  return multi ? [{ _cfg: true, multi: true }, ...clean] : clean
}
