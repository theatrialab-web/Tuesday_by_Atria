import { useEffect, useState } from 'react'
import { Plus, Trash2, Type, Hash, Calendar, User, Tag, Flag, CircleDot } from 'lucide-react'
import { Modal } from './ui'
import { WORKSPACE_COLORS, colOptions, colMulti, buildOptions } from '../lib/constants'

const SELECT_TYPES = ['status', 'priority', 'tag']
const isSelect = (type) => SELECT_TYPES.includes(type)

const genId = () =>
  (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 8)

const TYPE_OPTIONS = [
  { type: 'status', label: 'Estado', icon: CircleDot },
  { type: 'tag', label: 'Etiqueta / Marca', icon: Tag },
  { type: 'priority', label: 'Prioridad', icon: Flag },
  { type: 'person', label: 'Persona', icon: User },
  { type: 'date', label: 'Fecha', icon: Calendar },
  { type: 'number', label: 'Número', icon: Hash },
  { type: 'text', label: 'Texto', icon: Type },
]

export function AddColumnModal({ open, onClose, addColumn }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('status')
  const [multi, setMulti] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setName(''); setType('status'); setMulti(false) } }, [open])

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      await addColumn({ name: name.trim(), type, multi })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const selectable = ['status', 'priority', 'tag'].includes(type)

  return (
    <Modal open={open} onClose={onClose} title="Nueva columna">
      <div className="flex flex-col gap-4">
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Nombre de la columna"
          className="w-full text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />

        <div className="grid grid-cols-2 gap-2">
          {TYPE_OPTIONS.map(({ type: t, label, icon: Icon }) => (
            <button key={t} onClick={() => setType(t)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-ios-sm text-sm font-medium text-left border ${
                type === t ? 'border-brand bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'hairline text-2'
              }`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {selectable && (
          <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-ios-sm surface-2 cursor-pointer">
            <span className="text-sm font-medium">Permitir varias opciones por tarea</span>
            <input type="checkbox" checked={multi} onChange={e => setMulti(e.target.checked)}
              className="w-4 h-4 rounded accent-brand" />
          </label>
        )}

        <button onClick={submit} disabled={!name.trim() || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear columna'}
        </button>
      </div>
    </Modal>
  )
}

export function ColumnOptionsEditor({ column, onClose, updateColumn, deleteColumn }) {
  const [name, setName] = useState('')
  const [options, setOptions] = useState([])
  const [multi, setMulti] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (column) {
      setName(column.name || '')
      setOptions(colOptions(column))
      setMulti(colMulti(column))
    }
  }, [column?.id])

  if (!column) return null

  const selectable = isSelect(column.type)

  const addOption = () =>
    setOptions(o => [...o, { id: genId(), label: 'Nueva opción', color: WORKSPACE_COLORS[o.length % WORKSPACE_COLORS.length] }])

  const updateOption = (id, patch) =>
    setOptions(o => o.map(opt => (opt.id === id ? { ...opt, ...patch } : opt)))

  const removeOption = (id) =>
    setOptions(o => o.filter(opt => opt.id !== id))

  const save = async () => {
    setBusy(true)
    try {
      const patch = { name: name.trim() || column.name }
      if (selectable) patch.options = buildOptions(options, multi)
      await updateColumn(column.id, patch)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(`¿Eliminar la columna "${column.name}"? Se perderán sus valores.`)) return
    setBusy(true)
    try {
      await deleteColumn(column.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={!!column} onClose={onClose} title="Editar columna">
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-2">Nombre</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 rounded-ios-sm surface-2 text-sm" />
        </div>

        {selectable && (
          <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-ios-sm surface-2 cursor-pointer">
            <span className="text-sm font-medium">Permitir varias opciones por tarea</span>
            <input type="checkbox" checked={multi} onChange={e => setMulti(e.target.checked)}
              className="w-4 h-4 rounded accent-brand" />
          </label>
        )}

        {selectable && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-2">Opciones</label>
            <div className="flex flex-col gap-2 mt-2">
              {options.map(opt => (
                <div key={opt.id} className="flex items-center gap-2">
                  <label className="relative shrink-0 w-7 h-7 rounded-full cursor-pointer" style={{ backgroundColor: opt.color }}>
                    <input type="color" value={opt.color}
                      onChange={e => updateOption(opt.id, { color: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Color" />
                  </label>
                  <input value={opt.label}
                    onChange={e => updateOption(opt.id, { label: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-ios-sm surface-2 text-sm" />
                  <button onClick={() => removeOption(opt.id)} aria-label="Eliminar opción"
                    className="p-1.5 text-2 hover:text-[#E2445C]">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button onClick={addOption}
                className="flex items-center gap-2 text-sm font-medium text-brand dark:text-brand-light px-1 py-1.5">
                <Plus size={15} /> Añadir opción
              </button>
            </div>
          </div>
        )}

        <button onClick={save} disabled={busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={remove} disabled={busy}
          className="self-start flex items-center gap-1.5 text-sm text-[#E2445C] font-medium">
          <Trash2 size={14} /> Eliminar columna
        </button>
      </div>
    </Modal>
  )
}
