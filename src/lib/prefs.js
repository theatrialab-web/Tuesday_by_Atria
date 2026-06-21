export function glassEnabled() {
  try { return localStorage.getItem('glass') !== 'off' } catch { return true }
}
export function applyGlass(on) {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('glass-off', !on)
}
export function setGlass(on) {
  try { localStorage.setItem('glass', on ? 'on' : 'off') } catch { /* noop */ }
  applyGlass(on)
}

export function bgValue() {
  try { return localStorage.getItem('bg') || '' } catch { return '' }
}
export function applyBg(val) {
  if (typeof document === 'undefined') return
  const b = document.body
  if (val) {
    const isImg = /^https?:|^data:/.test(val)
    const layer = isImg
      ? `linear-gradient(rgba(0,0,0,0.10), rgba(0,0,0,0.10)), url("${val}")`
      : val
    b.style.backgroundImage = layer
    b.style.backgroundSize = 'cover'
    b.style.backgroundPosition = 'center'
    b.style.backgroundAttachment = 'fixed'
    b.classList.add('has-bg')
  } else {
    b.style.backgroundImage = ''
    b.style.backgroundSize = ''
    b.style.backgroundPosition = ''
    b.style.backgroundAttachment = ''
    b.classList.remove('has-bg')
  }
}
export function setBg(val) {
  try { val ? localStorage.setItem('bg', val) : localStorage.removeItem('bg') } catch { /* noop */ }
  applyBg(val)
}
