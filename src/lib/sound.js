// Sonidos sintetizados (sin archivos externos).
let ctx = null
function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

function tone(c, freq, at, dur = 0.33, vol = 0.25, type = 'triangle') {
  const now = c.currentTime
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, now + at)
  gain.gain.exponentialRampToValueAtTime(vol, now + at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + at + dur)
  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(now + at)
  osc.stop(now + at + dur + 0.02)
}

function playSeq(seq) {
  const c = getCtx()
  if (!c) return
  const go = () => seq.forEach(([f, t, d, v]) => tone(c, f, t, d ?? 0.33, v ?? 0.25))
  try {
    if (c.state === 'suspended') c.resume().then(go).catch(() => {})
    else go()
  } catch { /* navegador bloqueo el audio */ }
}

export function notifSoundEnabled() {
  try { return localStorage.getItem('notif-sound') !== 'off' } catch { return true }
}
export function setNotifSound(on) {
  try { localStorage.setItem('notif-sound', on ? 'on' : 'off') } catch { /* noop */ }
}

export function playNotificationSound() {
  if (!notifSoundEnabled()) return
  playSeq([[880, 0], [1320, 0.12]])
}

// Pomodoro: 'work' = ascendente (enfoque), 'break' = descendente (relax).
export function playPomodoroSound(kind) {
  if (kind === 'break') playSeq([[660, 0, 0.3], [523, 0.16, 0.3], [392, 0.32, 0.45]])
  else playSeq([[523, 0, 0.28], [659, 0.14, 0.28], [784, 0.28, 0.45]])
}

// "Despertar" el audio en la primera interaccion del usuario.
if (typeof window !== 'undefined') {
  const prime = () => {
    const c = getCtx()
    if (c && c.state === 'suspended') c.resume().catch(() => {})
    window.removeEventListener('pointerdown', prime)
    window.removeEventListener('keydown', prime)
  }
  window.addEventListener('pointerdown', prime)
  window.addEventListener('keydown', prime)
}
