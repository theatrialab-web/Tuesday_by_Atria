import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { Modal, Avatar, WorkspaceIcon } from './ui'
import { WORKSPACE_COLORS, DEFAULT_ICON_COLOR } from '../lib/constants'
import { IconEmojiGrid, ColorRow } from './IconEmojiPicker'
import { useWorkspaces, useKnownContacts } from '../hooks/useWorkspaces'
import { useAuth } from '../contexts/AuthContext'

export function CreateWorkspaceModal({ open, onClose, onCreated }) {
  const { createWorkspace } = useWorkspaces()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('briefcase')
  const [color, setColor] = useState(DEFAULT_ICON_COLOR)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true); setError(null)
    try {
      const ws = await createWorkspace({ name: name.trim(), icon, color })
      setName('')
      onCreated?.(ws)
    } catch (e) {
      setError(e.message || 'No se pudo crear el workspace')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo workspace">
      <div className="flex flex-col items-center gap-4">
        <WorkspaceIcon icon={icon} color={color} size={72} round />
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Nombre del workspace"
          className="w-full text-center text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />

        <ColorRow value={color} onPick={setColor} />
        <IconEmojiGrid value={icon} onPick={setIcon} />

        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || busy}
          className="w-full py-3 rounded-ios-sm btn-brand font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear workspace'}
        </button>
      </div>
    </Modal>
  )
}


export function CreateBoardModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [color, setColor] = useState(DEFAULT_ICON_COLOR)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true); setError(null)
    try {
      await onCreate(name.trim(), icon, color)
      setName('')
      onClose()
    } catch (e) {
      setError(e.message || 'No se pudo crear el board')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo board">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <WorkspaceIcon icon={icon} color={color} size={44} />
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Nombre del board"
            className="flex-1 text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />
        </div>
        <ColorRow value={color} onPick={setColor} />
        <IconEmojiGrid value={icon} onPick={setIcon} />
        <p className="text-xs text-2">
          Se creará con las columnas: Estado, Persona, Fecha, Marca y Urgencia.
        </p>
        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || busy}
          className="w-full py-3 rounded-ios-sm btn-brand font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear board'}
        </button>
      </div>
    </Modal>
  )
}

export function MembersModal({ open, onClose, members, inviteByEmail, removeMember }) {
  const { user } = useAuth()
  const contacts = useKnownContacts()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const memberIds = new Set(members.map(m => m.id))
  const q = email.trim().toLowerCase()
  const suggestions = q.length >= 3
    ? contacts.filter(c =>
        !memberIds.has(c.id) && c.id !== user?.id &&
        ((c.email || '').toLowerCase().includes(q) || (c.full_name || '').toLowerCase().includes(q)))
      .slice(0, 5)
    : []

  const doInvite = async (value) => {
    const target = (value ?? email).trim()
    if (!target || busy) return
    setBusy(true); setMsg(null)
    try {
      const p = await inviteByEmail(target)
      setMsg({ ok: true, text: `${p.full_name || p.email} agregado al workspace.` })
      setEmail('')
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Miembros">
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex gap-2">
            <input value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doInvite()}
              type="email" placeholder="email@ejemplo.com" autoComplete="off"
              className="flex-1 px-3 py-2.5 rounded-ios-sm surface-2 text-sm placeholder:text-2" />
            <button onClick={() => doInvite()} disabled={!email.trim() || busy}
              className="px-4 rounded-ios-sm btn-brand text-sm font-semibold disabled:opacity-40">
              Invitar
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-1.5 surface border hairline rounded-ios-sm overflow-hidden">
              <p className="text-[10px] uppercase tracking-wide text-2 px-3 pt-2 pb-1">Ya en tus otros workspaces</p>
              {suggestions.map(c => (
                <button key={c.id} onClick={() => doInvite(c.email)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:surface-2">
                  <Avatar profile={c} size={28} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.full_name || c.email}</p>
                    {c.full_name && <p className="text-[11px] text-2 truncate">{c.email}</p>}
                  </div>
                  <Plus size={15} className="text-brand dark:text-brand-light shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
        {msg && <p className={`text-xs ${msg.ok ? 'text-[#00C875]' : 'text-[#E2445C]'}`}>{msg.text}</p>}
        <p className="text-[11px] text-2">
          La persona debe haber iniciado sesión en la app al menos una vez para poder invitarla.
        </p>
        <div className="flex flex-col divide-y hairline">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 py-2.5">
              <Avatar profile={m} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.full_name || m.email}</p>
                <p className="text-xs text-2 truncate">{m.email}</p>
              </div>
              {m.id !== user?.id && (
                <button onClick={() => removeMember(m.id)} aria-label="Quitar miembro"
                  className="p-1.5 rounded-full text-2 hover:text-[#E2445C]">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
