import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Avatar } from './ui'

// Invitar personas a TODOS tus workspaces de una vez + lista del equipo.
export function GlobalTeam() {
  const [people, setPeople] = useState([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = async () => {
    const { data } = await supabase
      .from('workspace_members')
      .select('profiles(id, full_name, email, avatar_url)')
    const map = new Map()
    for (const row of data || []) if (row.profiles) map.set(row.profiles.id, row.profiles)
    setPeople([...map.values()])
  }
  useEffect(() => { load() }, [])

  const invite = async () => {
    const e = email.trim()
    if (!e || busy) return
    setBusy(true); setMsg(null)
    try {
      const { data: profile } = await supabase
        .from('profiles').select('id').ilike('email', e).maybeSingle()
      if (!profile) throw new Error('No existe un usuario con ese correo. Debe iniciar sesión en la app al menos una vez.')
      const { data: wss } = await supabase.from('workspaces').select('id')
      if (!wss?.length) throw new Error('No tienes workspaces todavía.')
      const rows = wss.map(w => ({ workspace_id: w.id, user_id: profile.id }))
      const { error } = await supabase.from('workspace_members')
        .upsert(rows, { onConflict: 'workspace_id,user_id', ignoreDuplicates: true })
      if (error) throw error
      setEmail('')
      setMsg({ ok: true, text: `Añadido a ${wss.length} workspace${wss.length === 1 ? '' : 's'}.` })
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.message || 'No se pudo invitar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="surface rounded-ios border hairline p-5 mb-5">
      <h2 className="text-sm font-semibold mb-1">Equipo</h2>
      <p className="text-xs text-2 mb-3">Invita a una persona a todos tus workspaces a la vez.</p>
      <div className="flex gap-2">
        <input value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && invite()}
          placeholder="correo@ejemplo.com" type="email"
          className="flex-1 min-w-0 text-sm rounded-ios-sm surface-2 px-3 py-2 outline-none" />
        <button onClick={invite} disabled={busy || !email.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-ios-sm btn-brand text-sm font-semibold disabled:opacity-40">
          <UserPlus size={15} /> Invitar
        </button>
      </div>
      {msg && <p className={`text-xs mt-2 ${msg.ok ? 'text-[#00C875]' : 'text-[#E2445C]'}`}>{msg.text}</p>}

      {people.length > 0 && (
        <div className="mt-4 flex flex-col gap-1">
          {people.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <Avatar profile={p} size={30} />
              <span className="min-w-0">
                <span className="text-sm font-medium block truncate">{p.full_name || 'Usuario'}</span>
                <span className="text-[11px] text-2 block truncate">{p.email}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
