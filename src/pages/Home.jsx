import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowUpRight, CalendarDays, CreditCard, LayoutGrid, Video, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useGlobalCalendar } from '../hooks/useGlobalCalendar'
import { useAllBilling } from '../hooks/useBilling'
import { WorkspaceIcon, Brand } from '../components/ui'
import { money } from '../components/BillingView'
import { toDateStr } from '../lib/calendar'
import { CreateWorkspaceModal } from '../components/CreateModals'

function RoundLink({ to }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} aria-label="Abrir"
      className="w-9 h-9 grid place-items-center rounded-full surface-2 text-2 hover:text-1 active:scale-95 transition-transform shrink-0">
      <ArrowUpRight size={16} />
    </button>
  )
}

function dayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}
function monthShort(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
}

export default function Home() {
  const { profile } = useAuth()
  const { workspaces, loading } = useWorkspaces()
  const { eventsByDate } = useGlobalCalendar()
  const { cycles, paidByCycle } = useAllBilling()
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const upcoming = useMemo(() => {
    const today = toDateStr(new Date())
    const out = []
    for (const [date, evs] of Object.entries(eventsByDate)) {
      if (date >= today) for (const e of evs) out.push({ ...e, date })
    }
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    return out.slice(0, 5)
  }, [eventsByDate])

  const billing = useMemo(() => {
    const rows = cycles.map(c => {
      const total = Number(c.total_amount || 0)
      const paid = paidByCycle[c.id] || 0
      return { total, paid, remaining: Math.max(0, total - paid), status: c.status, period: (c.period_month || '').slice(0, 7) }
    })
    const collected = rows.reduce((s, r) => s + r.paid, 0)
    const pending = rows.filter(r => r.status !== 'paid').reduce((s, r) => s + r.remaining, 0)
    const map = new Map()
    for (const r of rows) {
      if (!r.period) continue
      const e = map.get(r.period) || { key: r.period, fact: 0, cob: 0 }
      e.fact += r.total; e.cob += r.paid; map.set(r.period, e)
    }
    const monthly = [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1)).slice(-6)
    return { collected, pending, monthly, cur: cycles[0]?.currency }
  }, [cycles, paidByCycle])
  const maxV = Math.max(1, ...billing.monthly.map(m => m.fact))

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-5"><Brand logoHeight={20} /></div>
      <h1 className="text-2xl font-semibold mb-6">Hola, {profile?.full_name?.split(' ')[0] || ''} 👋</h1>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Workspaces */}
        <section className="tint-brand rounded-ios border hairline p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-brand dark:text-brand-light" />
              <h2 className="font-semibold">Workspaces</h2>
              <span className="text-xs text-2">{workspaces.length}</span>
            </div>
          </div>
          {loading ? <p className="text-sm text-2">Cargando…</p> : (
            <div className="flex flex-wrap gap-2.5">
              {workspaces.map(ws => (
                <button key={ws.id} onClick={() => navigate(`/workspace/${ws.id}`)}
                  className="flex items-center gap-2.5 pl-2 pr-4 py-2 rounded-full surface border hairline active:scale-95 transition-transform">
                  <WorkspaceIcon icon={ws.icon} color={ws.color} size={28} />
                  <span className="text-sm font-medium max-w-[160px] truncate">{ws.name}</span>
                </button>
              ))}
              <button onClick={() => setCreateOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-dashed hairline text-2 hover:text-1 active:scale-95 transition-transform">
                <Plus size={16} /> <span className="text-sm font-medium">Nuevo</span>
              </button>
            </div>
          )}
        </section>

        {/* Calendario reducido */}
        <section className="surface rounded-ios border hairline p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-brand dark:text-brand-light" />
              <h2 className="font-semibold">Próximo</h2>
            </div>
            <RoundLink to="/calendario" />
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-2 py-6 text-center">Nada en el horizonte cercano.</p>
          ) : (
            <div className="flex flex-col">
              {upcoming.map((e, i) => {
                const meeting = e.type === 'meeting'
                const color = meeting ? '#6C4FF7' : e.mine ? '#00C875' : '#4318C9'
                return (
                  <button key={i}
                    onClick={() => meeting && e.link ? window.open(e.link, '_blank') : e.boardId ? navigate(`/board/${e.boardId}`) : navigate('/calendario')}
                    className="flex items-center gap-3 py-2.5 border-b hairline last:border-0 text-left">
                    <span className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1.5">
                        {meeting && <Video size={13} className="shrink-0" style={{ color }} />}
                        {e.title}
                      </p>
                      <p className="text-[11px] text-2 capitalize">{dayLabel(e.date)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Cobros reducido */}
        <section className="surface rounded-ios border hairline p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-brand dark:text-brand-light" />
              <h2 className="font-semibold">Cobros</h2>
            </div>
            <RoundLink to="/cobros" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-ios-sm surface-2 p-3">
              <p className="text-[11px] text-2 mb-0.5">Pendiente</p>
              <p className="text-lg font-semibold text-[#E2445C]">{money(billing.pending, billing.cur)}</p>
            </div>
            <div className="rounded-ios-sm surface-2 p-3">
              <p className="text-[11px] text-2 mb-0.5">Cobrado</p>
              <p className="text-lg font-semibold text-[#00C875]">{money(billing.collected, billing.cur)}</p>
            </div>
          </div>
          {billing.monthly.length > 0 ? (
            <div className="flex items-end gap-2 h-20">
              {billing.monthly.map(m => (
                <div key={m.key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="flex items-end gap-0.5 h-full w-full justify-center">
                    <div className="w-2 rounded-t bg-brand" style={{ height: `${Math.max(3, (m.fact / maxV) * 100)}%` }} />
                    <div className="w-2 rounded-t bg-[#00C875]" style={{ height: `${Math.max(3, (m.cob / maxV) * 100)}%` }} />
                  </div>
                  <span className="text-[9px] text-2 capitalize">{monthShort(m.key)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-2 py-4 text-center flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} /> Sin cobros configurados.
            </p>
          )}
        </section>
      </div>

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={(ws) => { setCreateOpen(false); navigate(`/workspace/${ws.id}`) }} />
    </div>
  )
}
