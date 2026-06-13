// Markdown ligero y seguro para comentarios.
// Escapa HTML primero (evita inyección), luego aplica formato básico.

function escapeHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function renderRich(text) {
  let s = escapeHtml(text)
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
  // cursiva con _ , evitando partir palabras con guion bajo interno
  s = s.replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s.,!?)])/g, '$1<em>$2</em>')
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
