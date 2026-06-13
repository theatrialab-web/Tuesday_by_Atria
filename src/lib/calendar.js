// Utilidades de calendario. Todo en hora local para evitar el corrimiento
// de un día que provoca usar UTC con cadenas 'YYYY-MM-DD'.

const pad = (n) => String(n).padStart(2, '0')

export function toDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function fromDateStr(str) {
  // 'YYYY-MM-DD' -> Date local a medianoche
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function monthLabel(year, month) {
  return new Date(year, month, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

// Devuelve un arreglo de semanas; cada semana es un arreglo de 7 objetos día.
// La semana empieza en lunes.
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  // getDay(): 0=domingo..6=sábado. Queremos lunes=0.
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, month, 1 - startOffset)

  const last = new Date(year, month + 1, 0)
  const endOffset = (7 - ((last.getDay() + 6) % 7) - 1)
  const end = new Date(year, month + 1, 0 + endOffset)

  const todayStr = toDateStr(new Date())
  const weeks = []
  let cursor = new Date(start)
  while (cursor <= end) {
    const week = []
    for (let i = 0; i < 7; i++) {
      week.push({
        date: new Date(cursor),
        dateStr: toDateStr(cursor),
        inMonth: cursor.getMonth() === month,
        isToday: toDateStr(cursor) === todayStr,
      })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}
