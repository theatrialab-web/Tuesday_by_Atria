import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Maximize2, X } from 'lucide-react'
import { usePomodoro, fmt } from '../contexts/PomodoroContext'
import { useIsMobile } from '../hooks/useIsMobile'

const WORK_COLOR = '#4318C9'
const BREAK_COLOR = '#00C875'
const BTN = 66        // tamaño aprox del boton (incluye padding)
const POS_KEY = 'pomodoro-pos'

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

function clampPos(x, y) {
  const w = window.innerWidth, h = window.innerHeight
  const cx = Math.min(Math.max(8, x), w - BTN - 8)
  const cy = Math.min(Math.max(70, y), h - BTN - 88) // deja sitio para la barra inferior
  return { x: cx, y: cy }
}

export function PomodoroWidget() {
  const p = usePomodoro()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const drag = useRef({ on: false, moved: false, ox: 0, oy: 0, justDragged: false })
  const btnRef = useRef(null)

  // Posicion inicial en movil (guardada o esquina inferior derecha)
  useEffect(() => {
    if (!isMobile) return
    let saved = null
    try { saved = JSON.parse(localStorage.getItem(POS_KEY)) } catch { /* noop */ }
    setPos(clampPos(
      saved?.x ?? (window.innerWidth - BTN - 16),
      saved?.y ?? (window.innerHeight - BTN - 96)
    ))
  }, [isMobile])

  // Reajustar si cambia el tamaño de la ventana
  useEffect(() => {
    if (!isMobile) return
    const onResize = () => setPos(pp => (pp ? clampPos(pp.x, pp.y) : pp))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isMobile])

  const onPointerDown = (e) => {
    if (!isMobile) return
    const rect = btnRef.current.getBoundingClientRect()
    drag.current = { on: true, moved: false, ox: e.clientX - rect.left, oy: e.clientY - rect.top, justDragged: false }
    btnRef.current.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current.on) return
    const nx = e.clientX - drag.current.ox
    const ny = e.clientY - drag.current.oy
    const next = clampPos(nx, ny)
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 0) drag.current.moved = true
    setPos(next)
  }
  const onPointerUp = (e) => {
    if (!drag.current.on) return
    drag.current.on = false
    btnRef.current.releasePointerCapture?.(e.pointerId)
    if (drag.current.moved) {
      drag.current.justDragged = true
      setPos(pp => { if (pp) localStorage.setItem(POS_KEY, JSON.stringify(pp)); return pp })
    }
  }

  const onClick = () => {
    if (drag.current.justDragged) { drag.current.justDragged = false; return } // fue arrastre, no abrir
    setOpen(o => !o)
  }

  if (!p) return null
  const color = p.mode === 'work' ? WORK_COLOR : BREAK_COLOR
  const Icon = p.mode === 'work' ? Brain : Coffee

  // Estilo/posicion del boton
  const btnStyle = isMobile && pos ? { position: 'fixed', left: pos.x, top: pos.y } : undefined
  const btnClass = isMobile
    ? 'fixed z-[80] touch-none active:scale-95 transition-transform'
    : `fixed z-[80] right-4 bottom-6 active:scale-95 transition-transform ${p.running ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''}`

  // Posicion del panel en movil: encima o debajo del boton segun el espacio
  let panelStyle
  if (isMobile && pos) {
    const below = pos.y < window.innerHeight / 2
    const left = Math.min(Math.max(8, pos.x + BTN / 2 - 144), window.innerWidth - 288 - 8)
    panelStyle = below
      ? { position: 'fixed', left, top: pos.y + BTN + 8 }
      : { position: 'fixed', left, bottom: window.innerHeight - pos.y + 8 }
  }

  return (
    <>
      <button ref={btnRef} onClick={onClick} aria-label="Temporizador de enfoque"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        className={btnClass} style={btnStyle}>
        <div className="rounded-full glass-strong border hairline p-1.5">
          <Ring progress={p.progress} size={54} color={color}>
            {p.running
              ? <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{fmt(p.secondsLeft)}</span>
              : <Icon size={20} style={{ color }} />}
          </Ring>
        </div>
      </button>

      {open && createPortal(
        <div className="w-72 glass-strong rounded-ios border hairline p-4 anim-pop z-[81]"
          style={panelStyle || { position: 'fixed', right: 16, bottom: 96 }}>
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
