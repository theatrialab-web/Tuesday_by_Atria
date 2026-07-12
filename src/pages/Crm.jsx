import { useMemo, useState } from 'react'
import { useIsMobile } from '../hooks/useIsMobile'
import { Plus, Trash2, Handshake, Phone, Mail, Users, StickyNote, AlarmClock, Euro, X } from 'lucide-react'
import { useCrm, useClientInteractions, CRM_STAGES, daysToRenewal } from '../hooks/useCrm'
import { useWorkspaces, useKnownContacts } from '../hooks/useWorkspaces'
import { Modal, Avatar, WorkspaceIcon, WorkspaceDropdown } from '../components/ui'
import { DateField } from '../components/DatePicker'
import { money } from '../components/BillingView'

const KIND_META = {
  llamada: { icon: Phone, label: 'Llamada' },
  email: { icon: Mail, label: 'Email' },
  reunion: { icon: Users, label: 'Reunión' },
  nota: { icon: StickyNote, label: 'Nota' },
}

function RenewalBadge({ client }) {
  const d = daysToRenewal(client)
  if (d == null || d > 30) return null
  const color = d < 0 ? '#E2445C' : d <= 7 ? '#E2445C' : d <= 15 ? '#FDAB3D' : '#579BFC'
  const text = d < 0 ? `Venció hace ${Math.abs(d)}d` : d === 0 ? 'Renueva hoy' : `Renueva en ${d}d`
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full text-white"
      style={{ backgroundColor: color }}>
      <AlarmClock size={10} /> {text}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-2">{label}</span>
      {children}
    </label>
  )
}

const inputCls = 'w-full surface-2 rounded-ios-sm px-3 py-2.5 text-sm outline-none'

function ClientModal({ open, onClose, client, onSave, onDelete, workspaces, contacts }) {
  const isNew = !client?.id
  const [form, setForm] = useState(() => ({
    name: client?.name || '', contact_name: client?.contact_name || '',
    email: client?.email || '', phone: client?.phone || '',
    stage: client?.stage || 'prospecto', services: client?.services || '',
    fee: client?.fee ?? '', currency: client?.currency || 'EUR',
    contract_start: client?.contract_start || null, contract_end: client?.contract_end || null,
    owner_id: client?.owner_id || null, workspace_id: client?.workspace_id || null,
    notes: client?.notes || '',
  }))
  const [err, setErr] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) { setErr('El nombre del cliente es obligatorio.'); return }
    onSave({ ...form, name: form.name.trim(), fee: form.fee === '' ? null : Number(form.fee) })
  }

  return (
    <Modal open={open} onClose={onClose} title={isNew ? 'Nuevo cliente' : 'Ficha del cliente'} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Nombre / cuenta">
          <input value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} autoFocus placeholder="Ej: Clínica DaVinci" />
        </Field>
        <Field label="Persona de contacto">
          <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Email">
          <input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Teléfono">
          <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Etapa">
            <div className="flex flex-wrap gap-1.5">
              {CRM_STAGES.map(s => (
                <button key={s.id} onClick={() => set('stage', s.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${form.stage === s.id ? 'text-white' : 'surface-2 text-2'}`}
                  style={form.stage === s.id ? { backgroundColor: s.color } : undefined}>
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Servicios contratados">
            <input value={form.services} onChange={e => set('services', e.target.value)} className={inputCls}
              placeholder="Ej: RRSS + 4 reels/mes + ads" />
          </Field>
        </div>
        <Field label="Tarifa">
          <div className="flex gap-2">
            <input type="number" value={form.fee} onChange={e => set('fee', e.target.value)} className={inputCls} placeholder="0" />
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="surface-2 rounded-ios-sm px-2 text-sm outline-none">
              {['EUR', 'USD', 'COP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Responsable">
          <div className="flex flex-wrap gap-1.5">
            {contacts.map(p => (
              <button key={p.id} onClick={() => set('owner_id', form.owner_id === p.id ? null : p.id)}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-medium ${form.owner_id === p.id ? 'bg-brand text-white' : 'surface-2 text-2'}`}>
                <Avatar profile={p} size={20} /> {p.full_name || p.email}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Inicio de contrato">
          <div><DateField value={form.contract_start} onChange={v => set('contract_start', v)} placeholder="Elegir" /></div>
        </Field>
        <Field label="Fin de contrato (renovación)">
          <div><DateField value={form.contract_end} onChange={v => set('contract_end', v)} placeholder="Elegir" /></div>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Workspace vinculado">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <WorkspaceDropdown workspaces={workspaces} value={form.workspace_id || 'all'}
                  onChange={(v) => set('workspace_id', v === 'all' ? null : v)} allowAll title="Vincular workspace" placeholder="Sin vincular" />
              </div>
              {form.workspace_id && (
                <button onClick={() => set('workspace_id', null)} aria-label="Quitar vínculo"
                  className="p-2 rounded-full surface-2 text-2"><X size={14} /></button>
              )}
            </div>
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Notas">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className={inputCls + ' resize-y'} />
          </Field>
        </div>
      </div>

      {err && <p className="text-xs text-[#E2445C] mt-3">{err}</p>}

      {!isNew && <Interactions clientId={client.id} />}

      <div className="sticky bottom-0 z-10 -mx-5 px-5 py-3 mt-5 surface border-t hairline flex items-center justify-between"
        style={{ marginBottom: 'calc(-1.25rem)' }}>
        {!isNew ? (
          <button onClick={onDelete} className="flex items-center gap-1.5 text-sm text-[#E2445C] font-medium">
            <Trash2 size={14} /> Eliminar
          </button>
        ) : <span />}
        <button onClick={submit}
          className="px-5 py-2.5 rounded-ios-sm btn-brand bg-brand text-white text-sm font-semibold active:scale-95 transition-transform">
          {isNew ? 'Crear cliente' : 'Guardar'}
        </button>
      </div>
    </Modal>
  )
}

function Interactions({ clientId }) {
  const { items, addInteraction, deleteInteraction } = useClientInteractions(clientId)
  const [kind, setKind] = useState('nota')
  const [text, setText] = useState('')

  const send = async () => {
    const t = text.trim()
    if (!t) return
    const ok = await addInteraction(kind, t)
    if (ok) setText('')
  }

  return (
    <section className="mt-6 pt-4 border-t hairline">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-2 mb-2.5">Historial de interacciones</h3>
      <div className="flex items-center gap-1.5 mb-2">
        {Object.entries(KIND_META).map(([k, m]) => {
          const I = m.icon
          return (
            <button key={k} onClick={() => setKind(k)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${kind === k ? 'bg-brand text-white' : 'surface-2 text-2'}`}>
              <I size={12} /> {m.label}
            </button>
          )
        })}
      </div>
      <div className="flex items-end gap-2 mb-4">
        <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="¿Qué pasó? (llamada, acuerdo, decisión…)"
          className="flex-1 surface-2 rounded-ios-sm px-3 py-2.5 text-sm outline-none resize-y" />
        <button onClick={send} disabled={!text.trim()}
          className="px-4 py-2.5 rounded-ios-sm btn-brand bg-brand text-white text-sm font-semibold disabled:opacity-40">Añadir</button>
      </div>
      <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto">
        {items.length === 0 && <p className="text-xs text-2">Sin interacciones registradas todavía.</p>}
        {items.map(it => {
          const M = KIND_META[it.kind] || KIND_META.nota
          const I = M.icon
          return (
            <div key={it.id} className="flex items-start gap-2.5 group">
              <span className="w-7 h-7 rounded-full surface-2 grid place-items-center text-2 shrink-0 mt-0.5"><I size={13} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm break-words">{it.content}</p>
                <p className="text-[11px] text-2">
                  {M.label} · {it.author?.full_name || 'Alguien'} · {new Date(it.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={() => deleteInteraction(it.id)} aria-label="Eliminar"
                className="sm:opacity-0 group-hover:opacity-100 text-2 hover:text-[#E2445C] shrink-0"><Trash2 size={13} /></button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function Crm() {
  const isMobile = useIsMobile()
  const { clients, loading, createClient, updateClient, deleteClient, moveToStage } = useCrm()
  const { workspaces } = useWorkspaces()
  const contacts = useKnownContacts()
  const [modal, setModal] = useState(null) // {client} | {client:null} para nuevo
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const byStage = useMemo(() => {
    const m = Object.fromEntries(CRM_STAGES.map(s => [s.id, []]))
    for (const c of clients) (m[c.stage] || m.prospecto).push(c)
    return m
  }, [clients])

  const renewals = clients.filter(c => {
    const d = daysToRenewal(c)
    return d != null && d <= 30 && c.stage === 'activo'
  })

  const onSave = async (form) => {
    if (modal?.client?.id) await updateClient(modal.client.id, form)
    else await createClient(form)
    setModal(null)
  }

  return (
    <div className="p-5 sm:p-8">
      <div className="flex items-center justify-between gap-3 mb-5 max-w-5xl">
        <div className="flex items-center gap-2.5">
          <Handshake size={22} className="text-brand dark:text-brand-light" />
          <div>
            <h1 className="text-2xl font-semibold leading-tight">CRM</h1>
            <p className="text-sm text-2">Pipeline comercial de la agencia</p>
          </div>
        </div>
        <button onClick={() => setModal({ client: null })}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-ios-sm bg-brand text-white text-sm font-semibold active:scale-95 transition-transform">
          <Plus size={15} /> Cliente
        </button>
      </div>

      {renewals.length > 0 && (
        <div className="mb-5 max-w-5xl rounded-ios border hairline surface p-3.5 flex flex-wrap items-center gap-2">
          <AlarmClock size={16} className="text-[#FDAB3D] shrink-0" />
          <span className="text-sm font-medium">Renovaciones próximas:</span>
          {renewals.map(c => (
            <button key={c.id} onClick={() => setModal({ client: c })} className="inline-flex items-center gap-1.5">
              <span className="text-sm text-brand dark:text-brand-light font-medium">{c.name}</span>
              <RenewalBadge client={c} />
            </button>
          ))}
        </div>
      )}

      {loading ? <p className="text-sm text-2">Cargando…</p> : isMobile ? (
        <div className="flex flex-col gap-5">
          {CRM_STAGES.map(stage => {
            const list = byStage[stage.id]
            if (!list.length) return null
            return (
              <section key={stage.id} className="anim-rise">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h2 className="text-sm font-semibold">{stage.label}</h2>
                  <span className="text-xs text-2">{list.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {list.map(c => (
                    <div key={c.id} onClick={() => setModal({ client: c })}
                      className="surface rounded-ios border hairline p-3.5 active:scale-[.99] transition-transform">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug">{c.name}</p>
                        {c.owner && <Avatar profile={c.owner} size={24} />}
                      </div>
                      {c.services && <p className="text-xs text-2 mt-0.5 line-clamp-2">{c.services}</p>}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {c.fee != null && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold surface-2 rounded-full px-2 py-0.5">
                            <Euro size={10} /> {money(Number(c.fee), c.currency)}
                          </span>
                        )}
                        {c.workspace && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-2">
                            <WorkspaceIcon icon={c.workspace.icon} color={c.workspace.color} size={14} /> {c.workspace.name}
                          </span>
                        )}
                        <RenewalBadge client={c} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
          {clients.length === 0 && (
            <p className="text-sm text-2 text-center py-8">Sin clientes todavía. Crea el primero con el botón «Cliente».</p>
          )}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-5 px-5 sm:-mx-8 sm:px-8">
          {CRM_STAGES.map(stage => (
            <div key={stage.id}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverStage(stage.id) } }}
              onDragLeave={() => { if (overStage === stage.id) setOverStage(null) }}
              onDrop={() => { if (dragId) moveToStage(dragId, stage.id); setDragId(null); setOverStage(null) }}
              className={`w-[260px] shrink-0 rounded-ios p-2.5 transition-colors ${overStage === stage.id && dragId ? 'surface-2 ring-2 ring-brand-light' : 'surface-2/60'}`}
              style={{ background: overStage === stage.id && dragId ? undefined : 'var(--surface-2)' }}>
              <div className="flex items-center gap-2 px-1 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-sm font-semibold">{stage.label}</span>
                <span className="text-[11px] text-2 ml-auto">{byStage[stage.id].length}</span>
              </div>
              <div className="flex flex-col gap-2 min-h-[40px]">
                {byStage[stage.id].map(c => (
                  <div key={c.id} draggable
                    onDragStart={(e) => { setDragId(c.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { setDragId(null); setOverStage(null) }}
                    onClick={() => setModal({ client: c })}
                    className={`surface rounded-ios-sm border hairline p-3 cursor-pointer active:scale-[.99] transition-transform ${dragId === c.id ? 'opacity-40' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{c.name}</p>
                      {c.owner && <Avatar profile={c.owner} size={22} />}
                    </div>
                    {c.services && <p className="text-[11px] text-2 mt-0.5 line-clamp-2">{c.services}</p>}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {c.fee != null && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold surface-2 rounded-full px-2 py-0.5">
                          <Euro size={10} /> {money(Number(c.fee), c.currency)}
                        </span>
                      )}
                      {c.workspace && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-2">
                          <WorkspaceIcon icon={c.workspace.icon} color={c.workspace.color} size={14} /> {c.workspace.name}
                        </span>
                      )}
                      <RenewalBadge client={c} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <ClientModal key={modal.client?.id || 'new'} open onClose={() => setModal(null)}
          client={modal.client} workspaces={workspaces} contacts={contacts}
          onSave={onSave}
          onDelete={() => { deleteClient(modal.client.id); setModal(null) }} />
      )}
    </div>
  )
}
