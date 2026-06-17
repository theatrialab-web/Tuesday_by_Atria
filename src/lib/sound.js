// Sonido de notificación sintetizado (sin archivos externos).
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

export function playNotificationSound() {
  if (!notifSoundEnabled()) return
  const c = getCtx()
  if (!c) return
  try {
    if (c.state === 'suspended') c.resume()
    const now = c.currentTime
    const notes = [[880, 0], [1320, 0.11]] // ding-dong corto y suave
    notes.forEach(([freq, t]) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + t)
      gain.gain.linearRampToValueAtTime(0.16, now + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.3)
      osc.connect(gain).connect(c.destination)
      osc.start(now + t)
      osc.stop(now + t + 0.32)
    })
  } catch { /* navegador bloqueó audio sin interacción previa */ }
}
