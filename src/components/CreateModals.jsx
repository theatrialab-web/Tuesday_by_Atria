import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, Avatar, WorkspaceIcon } from './ui'
import { WORKSPACE_COLORS } from '../lib/constants'
import { IconEmojiGrid } from './IconEmojiPicker'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useAuth } from '../contexts/AuthContext'

export function CreateWorkspaceModal({ open, onClose, onCreated }) {
  const { createWorkspace } = useWorkspaces()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('briefcase')
  const [color, setColor] = useState('#290880')
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
        <WorkspaceIcon icon={icon} color={color} size={72} />
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Nombre del workspace"
          className="w-full text-center text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />

        <div className="grid grid-cols-8 gap-2 w-full">
          {WORKSPACE_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
              className={`h-8 rounded-full transition-transform active:scale-90 ${color === c ? 'ring-2 ring-offset-2 ring-brand-light ring-offset-[var(--surface)]' : ''}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <IconEmojiGrid value={icon} onPick={setIcon} />

        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear workspace'}
        </button>
      </div>
    </Modal>
  )
}


export function CreateBoardModal({ open, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true); setError(null)
    try {
      await onCreate(name.trim(), icon)
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
          <WorkspaceIcon icon={icon} color="#290880" size={44} />
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Nombre del board"
            className="flex-1 text-lg font-semibold bg-transparent border-b hairline pb-2 placeholder:text-2" />
        </div>
        <IconEmojiGrid value={icon} onPick={setIcon} />
        <p className="text-xs text-2">
          Se creará con las columnas: Estado, Persona, Fecha, Marca y Urgencia.
        </p>
        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <button onClick={submit} disabled={!name.trim() || busy}
          className="w-full py-3 rounded-ios-sm bg-brand text-white font-semibold disabled:opacity-40 active:scale-[.98] transition-transform">
          {busy ? 'Creando…' : 'Crear board'}
        </button>
      </div>
    </Modal>
  )
}

export function MembersModal({ open, onClose, members, inviteByEmail, removeMember }) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const invite = async () => {
    if (!email.trim() || busy) return
    setBusy(true); setMsg(null)
    try {
      const p = await inviteByEmail(email)
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
        <div className="flex gap-2">
          <input value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && invite()}
            type="email" placeholder="email@ejemplo.com"
            className="flex-1 px-3 py-2.5 rounded-ios-sm surface-2 text-sm placeholder:text-2" />
          <button onClick={invite} disabled={!email.trim() || busy}
            className="px-4 rounded-ios-sm bg-brand text-white text-sm font-semibold disabled:opacity-40">
            Invitar
          </button>
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
