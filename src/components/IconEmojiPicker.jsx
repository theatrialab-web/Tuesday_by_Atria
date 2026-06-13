import { useEffect, useState } from 'react'
import { WORKSPACE_ICONS, WORKSPACE_COLORS } from '../lib/constants'
import { Modal, WorkspaceIcon } from './ui'
import { EMOJIS } from './EmojiPicker'

// Selector con dos pestañas: iconos (lucide) y emojis.
export function IconEmojiGrid({ value, onPick }) {
  const startTab = value && !WORKSPACE_ICONS.includes(value) ? 'emoji' : 'icon'
  const [tab, setTab] = useState(startTab)

  const tabBtn = (key, label) =>
    <button type="button" onClick={() => setTab(key)}
      className={`flex-1 text-xs font-semibold py-1.5 rounded-ios-sm ${tab === key ? 'bg-brand text-white' : 'surface-2 text-2'}`}>
      {label}
    </button>

  return (
    <div className="w-full">
      <div className="flex gap-1.5 mb-2">
        {tabBtn('icon', 'Iconos')}
        {tabBtn('emoji', 'Emojis')}
      </div>
      {tab === 'icon' ? (
        <div className="grid grid-cols-8 gap-2">
          {WORKSPACE_ICONS.map(i => (
            <button key={i} type="button" onClick={() => onPick(i)} aria-label={`Icono ${i}`}
              className={`h-9 rounded-ios-sm flex items-center justify-center surface-2 ${value === i ? 'ring-2 ring-brand-light' : ''}`}>
              <WorkspaceIcon icon={i} color="transparent" size={26} />
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto">
          {EMOJIS.map(e => (
            <button key={e} type="button" onClick={() => onPick(e)}
              className={`h-9 rounded-ios-sm flex items-center justify-center text-xl surface-2 ${value === e ? 'ring-2 ring-brand-light' : ''}`}>
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Modal para editar el icono (y opcionalmente color) de un workspace o board.
export function IconPickerModal({ open, onClose, title = 'Editar icono', value, color = '#290880', withColor = false, onSave }) {
  const [icon, setIcon] = useState(value)
  const [col, setCol] = useState(color)
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setIcon(value); setCol(color) } }, [open])

  if (!open) return null

  const save = async () => {
    setBusy(true)
    try {
      await onSave(withColor ? { icon, color: col } : { icon })
      onClose()
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col items-center gap-4">
        <WorkspaceIcon icon={icon} color={withColor ? col : color} size={64} />
        {withColor && (
          <div className="grid grid-cols-8 gap-2 w-full">
            {WORKSPACE_COLORS.map(c => (
              <button key={c} onClick={() => setCol(c)} aria-label={`Color ${c}`}
                className={`h-8 rounded-full active:scale-90 transition-transform ${col === c ? 'ring-2 ring-offset-2 ring-brand-light ring-offset-[var(--surface)]' : ''}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        )}
        <IconEmojiGrid value={icon} onPick={setIcon} />
        <button onClick={save} disabled={busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </Modal>
  )
}
