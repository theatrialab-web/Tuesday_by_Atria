import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Maximize2, X } from 'lucide-react'
import { usePomodoro, fmt } from '../contexts/PomodoroContext'

const WORK_COLOR = '#4318C9'
const BREAK_COLOR = '#00C875'

export function Ring({ progress, size = 56, stroke = 5, color = WORK_COLOR, track = 'rgba(120,120,140,0.18)', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 0.4s linear, stroke 0.3s' }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export function PomodoroWidget() {
  const p = usePomodoro()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (!p) return null

  const color = p.mode === 'work' ? WORK_COLOR : BREAK_COLOR
  const Icon = p.mode === 'work' ? Brain : Coffee

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Temporizador de enfoque"
        className={`fixed z-[80] right-4 bottom-24 sm:bottom-6 active:scale-95 transition-transform ${p.running ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''}`}>
        <div className="rounded-full surface shadow-2xl border hairline p-1.5">
          <Ring progress={p.progress} size={54} color={color}>
            {p.running
              ? <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{fmt(p.secondsLeft)}</span>
              : <Icon size={20} style={{ color }} />}
          </Ring>
        </div>
      </button>

      {open && createPortal(
        <div className="fixed z-[81] right-4 bottom-40 sm:bottom-24 w-72 surface rounded-ios shadow-2xl border hairline p-4 anim-pop">
          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
              style={{ color, backgroundColor: color + '1f' }}>
              <Icon size={13} /> {p.mode === 'work' ? 'Enfoque' : 'Descanso'}
            </span>
            <button onClick={() => setOpen(false)} className="p-1 rounded-full surface-2 text-2"><X size={14} /></button>
          </div>

          <div className="flex justify-center my-2">
            <Ring progress={p.progress} size={132} stroke={8} color={color}>
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums">{fmt(p.secondsLeft)}</p>
                <p className="text-[11px] text-2">{p.sessions} {p.sessions === 1 ? 'sesión' : 'sesiones'}</p>
              </div>
            </Ring>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <button onClick={p.reset} aria-label="Reiniciar"
              className="p-2.5 rounded-full surface-2 text-2 hover:text-1"><RotateCcw size={16} /></button>
            <button onClick={p.toggle}
              className="px-5 py-2.5 rounded-full text-white font-semibold text-sm flex items-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: color }}>
              {p.running ? <><Pause size={16} /> Pausar</> : <><Play size={16} /> Iniciar</>}
            </button>
            <button onClick={p.skip} aria-label="Saltar"
              className="p-2.5 rounded-full surface-2 text-2 hover:text-1"><SkipForward size={16} /></button>
          </div>

          <button onClick={() => { setOpen(false); navigate('/enfoque') }}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-medium text-2 hover:text-1">
            <Maximize2 size={12} /> Abrir pantalla de Enfoque
          </button>
        </div>,
        document.body
      )}
    </>
  )
}
