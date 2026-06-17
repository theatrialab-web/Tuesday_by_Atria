import { useRef, useState } from 'react'
import { Moon, Sun, LogOut, Camera, Bell, Volume2, VolumeX } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Avatar, Checkbox } from '../components/ui'
import { GlobalTeam } from '../components/GlobalTeam'
import { supabase } from '../lib/supabase'
import { notifSoundEnabled, setNotifSound, playNotificationSound } from '../lib/sound'

export default function Perfil() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { theme, toggle } = useTheme()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const [sound, setSound] = useState(notifSoundEnabled())

  const enableNotifs = async () => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') return
    const p = await Notification.requestPermission()
    setPerm(p)
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Elige una imagen.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Máximo 5 MB.'); return }
    setBusy(true); setError(null)
    try {
      const path = `avatars/${user.id}-${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('task-files').upload(path, file)
      if (upErr) throw upErr
      const url = supabase.storage.from('task-files').getPublicUrl(path).data.publicUrl
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      if (updErr) throw updErr
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'No se pudo subir el avatar.')
    } finally {
      setBusy(false)
    }
  }

  const removeAvatar = async () => {
    setBusy(true); setError(null)
    try {
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
      await refreshProfile()
    } catch (err) {
      setError(err.message || 'No se pudo quitar la foto.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-5 sm:p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Perfil</h1>

      <div className="surface rounded-ios border hairline p-6 flex flex-col items-center gap-4 mb-5">
        <div className="relative">
          <Avatar profile={profile} size={84} />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            aria-label="Cambiar avatar"
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shadow-md border-2"
            style={{ borderColor: 'var(--surface)' }}>
            <Camera size={15} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </div>
        <div className="text-center">
          <p className="font-medium text-lg">{profile?.full_name || 'Usuario'}</p>
          <p className="text-sm text-2">{profile?.email || user?.email}</p>
        </div>
        {error && <p className="text-xs text-[#E2445C]">{error}</p>}
        <div className="flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="text-sm font-medium px-3.5 py-2 rounded-ios-sm bg-brand text-white disabled:opacity-50">
            {busy ? 'Subiendo…' : 'Subir foto'}
          </button>
          {profile?.avatar_url && (
            <button onClick={removeAvatar} disabled={busy}
              className="text-sm font-medium px-3.5 py-2 rounded-ios-sm surface-2 text-2">
              Quitar foto
            </button>
          )}
        </div>
      </div>

      <div className="surface rounded-ios border hairline overflow-hidden mb-5">
        <button onClick={toggle} className="w-full flex items-center justify-between px-4 py-3.5 border-b hairline">
          <span className="flex items-center gap-3 text-sm font-medium">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            Apariencia
          </span>
          <span className="text-sm text-2">{theme === 'light' ? 'Claro' : 'Oscuro'}</span>
        </button>
        <button onClick={enableNotifs} disabled={perm === 'granted' || perm === 'unsupported'}
          className="w-full flex items-center justify-between px-4 py-3.5 text-left border-b hairline">
          <span className="flex items-center gap-3 text-sm font-medium">
            <Bell size={18} />
            Notificaciones de escritorio
          </span>
          <span className="text-sm text-2">
            {perm === 'granted' ? 'Activadas'
              : perm === 'denied' ? 'Bloqueadas en el navegador'
              : perm === 'unsupported' ? 'No disponible'
              : 'Activar'}
          </span>
        </button>
        <div className="w-full flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3 text-sm font-medium">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            Sonido de notificaciones
          </span>
          <Checkbox checked={sound} onChange={(v) => { setSound(v); setNotifSound(v); if (v) playNotificationSound() }} ariaLabel="Sonido de notificaciones" />
        </div>
      </div>
      {perm === 'denied' && (
        <p className="text-xs text-2 -mt-3 mb-5 px-1">
          Las bloqueaste antes. Para reactivarlas, cámbialas a mano en los ajustes del sitio en tu navegador (icono junto a la URL).
        </p>
      )}

      <GlobalTeam />

      <button onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-ios-sm surface border hairline text-sm font-medium text-[#E2445C] active:scale-[.98] transition-transform">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </div>
  )
}
