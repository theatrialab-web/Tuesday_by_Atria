import { useState } from 'react'
import { Smile } from 'lucide-react'
import { EMOJI_GROUPS, EMOJIS } from '../lib/emojis'

export { EMOJIS }

// Rejilla de emojis por categorías, reutilizable.
export function EmojiGrid({ onPick, cols = 8 }) {
  return (
    <div className="flex flex-col gap-2">
      {EMOJI_GROUPS.map(g => (
        <div key={g.name}>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-2 mb-1 sticky top-0 surface py-0.5">{g.name}</p>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {g.list.map((e, i) => (
              <button key={`${e}-${i}`} type="button" onClick={() => onPick(e)}
                className="text-xl leading-none h-8 rounded hover:surface-2">{e}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function EmojiPicker({ onPick }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} aria-label="Emojis"
        className="w-7 h-7 rounded-md surface hover:surface-2 text-2 flex items-center justify-center">
        <Smile size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-1 left-0 z-20 surface border hairline rounded-ios-sm shadow-xl p-2 w-[300px] max-h-64 overflow-y-auto">
            <EmojiGrid cols={8} onPick={(e) => { onPick(e); setOpen(false) }} />
          </div>
        </>
      )}
    </div>
  )
}
