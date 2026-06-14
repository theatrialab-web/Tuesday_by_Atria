import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X } from 'lucide-react'
import { WORKSPACE_COLORS } from '../lib/constants'

function hexToHsv(hex) {
  let h = (hex || '#290880').replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let hue = 0
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6
    else if (max === g) hue = (b - r) / d + 2
    else hue = (r - g) / d + 4
    hue *= 60; if (hue < 0) hue += 360
  }
  return { h: hue, s: max === 0 ? 0 : d / max, v: max }
}

function hsvToHex(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c
  let r, g, b
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const to = (n) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function ColorPopover({ value, onChange, onClose }) {
  const [hsv, setHsv] = useState(() => hexToHsv(value))
  const [hexInput, setHexInput] = useState(value)
  const areaRef = useRef(null)
  const hex = hsvToHex(hsv.h, hsv.s, hsv.v)

  useEffect(() => { onChange(hex); setHexInput(hex) }, [hsv.h, hsv.s, hsv.v])

  const fromArea = (e) => {
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.touches ? e.touches[0].clientX : e.clientX
    const cy = e.touches ? e.touches[0].clientY : e.clientY
    const x = Math.min(rect.width, Math.max(0, cx - rect.left))
    const y = Math.min(rect.height, Math.max(0, cy - rect.top))
    setHsv(prev => ({ ...prev, s: x / rect.width, v: 1 - y / rect.height }))
  }
  const startArea = (e) => {
    e.preventDefault()
    fromArea(e)
    const move = (ev) => fromArea(ev)
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up)
  }

  const applyHex = (val) => {
    setHexInput(val)
    let v = val.trim(); if (!v.startsWith('#')) v = '#' + v
    if (/^#([0-9a-fA-F]{6})$/.test(v)) setHsv(hexToHsv(v))
  }

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center" onClick={e => e.stopPropagation()}>
      <div className="absolute inset-0 bg-black/30 anim-fade" onClick={onClose} />
      <div className="relative surface rounded-t-ios sm:rounded-ios p-4 anim-sheet sm:anim-pop shadow-2xl w-full sm:w-[300px] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Color personalizado</span>
          <button onClick={onClose} className="p-1.5 rounded-full surface-2 text-2"><X size={15} /></button>
        </div>

        {/* Área saturación / brillo */}
        <div ref={areaRef} onPointerDown={startArea}
          className="relative w-full h-40 rounded-ios-sm cursor-crosshair touch-none"
          style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${hsv.h}, 100%, 50%)` }}>
          <span className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hex }} />
        </div>

        {/* Tono */}
        <input type="range" min="0" max="360" value={Math.round(hsv.h)}
          onChange={e => setHsv(prev => ({ ...prev, h: Number(e.target.value) }))}
          className="w-full mt-3 h-3 rounded-full appearance-none cursor-pointer hue-slider" />

        {/* Hex + preview */}
        <div className="flex items-center gap-2 mt-3">
          <span className="w-9 h-9 rounded-ios-sm border hairline shrink-0" style={{ backgroundColor: hex }} />
          <div className="flex-1 flex items-center surface-2 rounded-ios-sm px-2.5">
            <span className="text-2 text-sm">#</span>
            <input value={hexInput.replace(/^#/, '')} onChange={e => applyHex(e.target.value)}
              maxLength={6} placeholder="290880"
              className="w-full bg-transparent text-sm py-2 outline-none uppercase tracking-wide" />
          </div>
        </div>

        <button onClick={onClose}
          className="w-full mt-3 py-2.5 rounded-ios-sm bg-brand text-white text-sm font-semibold">Listo</button>
      </div>
    </div>,
    document.body
  )
}

export function CustomColorPicker({ value, onPick }) {
  const [open, setOpen] = useState(false)
  const isPreset = WORKSPACE_COLORS.includes(value)
  const selected = !isPreset && value
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Color personalizado"
        className={`h-8 rounded-full relative flex items-center justify-center border hairline ${selected ? 'ring-2 ring-offset-2 ring-brand-light ring-offset-[var(--surface)]' : ''}`}
        style={{ background: selected ? value : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
        {!selected && <Plus size={14} className="text-white drop-shadow" />}
      </button>
      {open && <ColorPopover value={selected || '#290880'} onChange={onPick} onClose={() => setOpen(false)} />}
    </>
  )
}
