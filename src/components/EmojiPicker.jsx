import { useState } from 'react'
import { Smile } from 'lucide-react'

export const EMOJIS = [
  '😀','😄','😁','😂','🙂','😉','😊','😍','😘','😎','🤔','😅','😴','😢','😡','🥳',
  '🤩','😭','🤯','🙃','😬','😇','🤝','👍','👎','👏','🙌','🙏','💪','👀','✌️','🫶',
  '🔥','✨','⭐','🎉','🎊','✅','❌','⚠️','❗','❓','💡','📌','📎','📅','⏰','📝',
  '🚀','💯','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💬','📈','📉','🏆','🎯','🔑',
  '🟢','🟡','🔴','🟣','🔵','⚪','🟠','⏳',
]

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
          <div className="absolute bottom-full mb-1 left-0 z-20 surface border hairline rounded-ios-sm shadow-xl p-2 w-[248px] max-h-48 overflow-y-auto grid grid-cols-8 gap-1">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => { onPick(e); setOpen(false) }}
                className="text-lg leading-none h-7 rounded hover:surface-2">{e}</button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
