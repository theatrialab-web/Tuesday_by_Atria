// Sonido de notificacion sintetizado (sin archivos externos).
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

export function notifSoundEnabled() {
  try { return localStorage.getItem('notif-sound') !== 'off' } catch { return true }
}
export function setNotifSound(on) {
  try { localStorage.setItem('notif-sound', on ? 'on' : 'off') } catch { /* noop */ }
}

function schedule(c) {
  const now = c.currentTime
  const notes = [[880, 0], [1320, 0.12]] // ding-dong corto
  notes.forEach(([freq, t]) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, now + t)
    gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(now + t)
    osc.stop(now + t + 0.37)
  })
}

export function playNotificationSound() {
  if (!notifSoundEnabled()) return
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume().then(() => schedule(c)).catch(() => {})
    else schedule(c)
  } catch { /* navegador bloqueo el audio */ }
}

// "Despertar" el audio en la primera interaccion del usuario, para que luego
// las notificaciones (que llegan sin un clic) puedan sonar.
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
