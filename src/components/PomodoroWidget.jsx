import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { usePomodoro, fmt } from '../contexts/PomodoroContext'
import { useIsMobile } from '../hooks/useIsMobile'

const WORK_COLOR = '#4318C9'
const BREAK_COLOR = '#00C875'
const BTN = 66        // tamaño aprox del boton (incluye padding)
const POS_KEY_MOBILE = 'pomodoro-pos-mobile'
const POS_KEY_DESKTOP = 'pomodoro-pos-desktop'

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

function clampPos(x, y, isMobile) {
  const w = window.innerWidth, h = window.innerHeight
  const bottomGap = isMobile ? 88 : 16 // en movil deja sitio para la barra inferior
  const cx = Math.min(Math.max(8, x), w - BTN - 8)
  const cy = Math.min(Math.max(isMobile ? 70 : 8, y), h - BTN - bottomGap)
  return { x: cx, y: cy }
}

export function PomodoroWidget() {
  const p = usePomodoro()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [docked, setDocked] = useState(null) // null | 'left' | 'right' 
  const drag = useRef({ on: false, moved: false, ox: 0, oy: 0, justDragged: false })
  const btnRef = useRef(null)
  const posKey = isMobile ? POS_KEY_MOBILE : POS_KEY_DESKTOP

  // Posicion inicial (guardada o esquina inferior derecha), para movil y escritorio
  useEffect(() => {
    let saved = null
    try { saved = JSON.parse(localStorage.getItem(posKey)) } catch { /* noop */ }
    const gap = isMobile ? 96 : 24
    setPos(clampPos(
      saved?.x ?? (window.innerWidth - BTN - gap),
      saved?.y ?? (window.innerHeight - BTN - gap),
      isMobile
    ))
    setDocked(saved?.docked || null)
  }, [isMobile, posKey])

  // Reajustar si cambia el tamaño de la ventana
  useEffect(() => {
    const onResize = () => setPos(pp => (pp ? clampPos(pp.x, pp.y, isMobile) : pp))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isMobile])

  const onPointerDown = (e) => {
    const rect = btnRef.current.getBoundingClientRect()
    drag.current = { on: true, moved: false, ox: e.clientX - rect.left, oy: e.clientY - rect.top, justDragged: false }
    btnRef.current.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e) => {
    if (!drag.current.on) return
    const next = clampPos(e.clientX - drag.current.ox, e.clientY - drag.current.oy, isMobile)
    if (Math.abs(e.movementX) + Math.abs(e.movementY) > 0) drag.current.moved = true
    setPos(next)
  }
  const onPointerUp = (e) => {
    if (!drag.current.on) return
    drag.current.on = false
    btnRef.current.releasePointerCapture?.(e.pointerId)
    if (drag.current.moved) {
      drag.current.justDragged = true
      setPos(pp => {
        if (!pp) return pp
        const w = window.innerWidth
        let side = null
        if (pp.x <= 10) side = 'left'
        else if (pp.x >= w - BTN - 10) side = 'right'
        setDocked(side)
        localStorage.setItem(posKey, JSON.stringify({ ...pp, docked: side }))
        return pp
      })
    }
  }

  // --- Pestana lateral cuando esta oculto en el borde ---
  const tabDrag = useRef({ on: false, moved: false, oy: 0, sx: 0 })
  const onTabDown = (e) => {
    tabDrag.current = { on: true, moved: false, oy: e.clientY - (pos?.y ?? 0), sx: e.clientX }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onTabMove = (e) => {
    if (!tabDrag.current.on) return
    tabDrag.current.moved = true
    const y = Math.min(Math.max(70, e.clientY - tabDrag.current.oy), window.innerHeight - 60)
    setPos(pp => (pp ? { ...pp, y } : pp))
    // si lo arrastra hacia adentro, se despliega
    const dx = e.clientX - tabDrag.current.sx
    if ((docked === 'left' && dx > 34) || (docked === 'right' && dx < -34)) {
      tabDrag.current.on = false
      undock()
    }
  }
  const onTabUp = () => {
    if (!tabDrag.current.on) return
    tabDrag.current.on = false
    if (!tabDrag.current.moved) undock() // toque simple: desplegar
    else setPos(pp => { if (pp) localStorage.setItem(posKey, JSON.stringify({ ...pp, docked })); return pp })
  }
  const undock = () => {
    setDocked(null)
    setPos(pp => {
      if (!pp) return pp
      const w = window.innerWidth
      const next = { x: docked === 'left' ? 14 : w - BTN - 14, y: pp.y }
      localStorage.setItem(posKey, JSON.stringify({ ...next, docked: null }))
      return next
    })
  }

  const onClick = () => {
    if (drag.current.justDragged) { drag.current.justDragged = false; return } // fue arrastre, no abrir
    setOpen(o => !o)
  }

  if (!p) return null
  const color = p.mode === 'work' ? WORK_COLOR : BREAK_COLOR
  const Icon = p.mode === 'work' ? Brain : Coffee

  // Estilo/posicion del boton (controlado por estado en movil y escritorio)
  const btnStyle = pos ? { position: 'fixed', left: pos.x, top: pos.y } : { position: 'fixed', right: 16, bottom: 24 }
  const btnClass = `z-[80] touch-none active:scale-95 transition-transform ${p.running ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''}`

  // Posicion del panel: encima o debajo del boton segun el espacio
  let panelStyle = { position: 'fixed', right: 16, bottom: 96 }
  if (pos) {
    const below = pos.y < window.innerHeight / 2
    const left = Math.min(Math.max(8, pos.x + BTN / 2 - 144), window.innerWidth - 288 - 8)
    panelStyle = below
      ? { position: 'fixed', left, top: pos.y + BTN + 8 }
      : { position: 'fixed', left, bottom: window.innerHeight - pos.y + 8 }
  }

  if (docked) {
    const Arrow = docked === 'left' ? ChevronRight : ChevronLeft
    return (
      <button aria-label="Mostrar temporizador de enfoque"
        onPointerDown={onTabDown} onPointerMove={onTabMove} onPointerUp={onTabUp}
        className="fixed z-[80] touch-none glass-strong border hairline shadow-lg active:scale-95 transition-transform"
        style={{
          top: pos?.y ?? 200, width: 26, height: 52,
          [docked]: 0,
          borderRadius: docked === 'left' ? '0 14px 14px 0' : '14px 0 0 14px',
          ...(p.running ? { boxShadow: `inset 0 0 0 2px ${color}55` } : {}),
        }}>
        <Arrow size={16} className="mx-auto" style={{ color }} />
      </button>
    )
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
          style={panelStyle}>
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
