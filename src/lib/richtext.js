// Markdown ligero y seguro para comentarios.
// Escapa HTML primero (evita inyección), luego aplica formato básico.

function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderRich(text, mentionNames = []) {
  let s = escapeHtml(text)
  // Enlaces clicables (antes que el resto, sobre texto ya escapado)
  s = s.replace(/\b(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, (m) => {
    let url = m, trail = ''
    const tm = url.match(/[.,!?;:)\]]+$/)
    if (tm) { trail = tm[0]; url = url.slice(0, -trail.length) }
    const href = url.startsWith('http') ? url : 'https://' + url
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="rt-link">${url}</a>${trail}`
  })
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
  // cursiva con _ , evitando partir palabras con guion bajo interno
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s.,!?)])/g, '$1<em>$2</em>')
  // Menciones: @Nombre -> chip con el nombre, sin la arroba
  if (mentionNames.length) {
    const needles = mentionNames
      .map(n => escapeHtml(n))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length)
      .map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (needles.length) {
      const re = new RegExp('@(' + needles.join('|') + ')', 'g')
      s = s.replace(re, '<span class="mention">$1</span>')
    }
  }
  s = s.replace(/\n/g, '<br/>')
  return s
}

// Inserta texto en la posición del cursor de un textarea.
export function insertAtCursor(el, text) {
  const s = el.selectionStart
  const e = el.selectionEnd
  const v = el.value
  const next = v.slice(0, s) + text + v.slice(e)
  const pos = s + text.length
  return { next, selStart: pos, selEnd: pos }
}

// Envuelve la selección de un textarea con marcadores (ej. ** para negrita).
// Devuelve el nuevo texto y la nueva posición del cursor.
export function wrapSelection(el, marker) {
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = el.value
  const selected = value.slice(start, end) || 'texto'
  const next = value.slice(0, start) + marker + selected + marker + value.slice(end)
  return { next, selStart: start + marker.length, selEnd: start + marker.length + selected.length }
}
