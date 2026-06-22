import { useRef, useState } from 'react'
import { Moon, Sun, LogOut, Camera, Bell, Volume2, VolumeX, Sparkles, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Avatar, Switch } from '../components/ui'
import { GlobalTeam } from '../components/GlobalTeam'
import { supabase } from '../lib/supabase'
import { notifSoundEnabled, setNotifSound, playNotificationSound } from '../lib/sound'
import { glassEnabled, setGlass, bgValue, setBg } from '../lib/prefs'

const BG_PRESETS = [
  { id: '', label: 'Ninguno', css: '' },
  { id: 'aurora', label: 'Aurora', css: 'linear-gradient(160deg,#5326D9 0%,#290880 55%,#120433 100%)' },
  { id: 'sunset', label: 'Atardecer', css: 'linear-gradient(160deg,#FF9A8B 0%,#FF6A88 50%,#FF99AC 100%)' },
  { id: 'ocean', label: 'Océano', css: 'linear-gradient(160deg,#2BC0E4 0%,#1A2980 100%)' },
  { id: 'mint', label: 'Menta', css: 'linear-gradient(160deg,#00C875 0%,#0086C0 100%)' },
  { id: 'graphite', label: 'Grafito', css: 'linear-gradient(160deg,#3A3A44 0%,#17171F 100%)' },
]

export default function Perfil() {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { theme, toggle } = useTheme()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const [sound, setSound] = useState(notifSoundEnabled())
  const [glass, setGlassState] = useState(glassEnabled())
  const [bg, setBgState] = useState(bgValue())
  const bgFileRef = useRef(null)

  const pickBg = (val) => { setBgState(val); setBg(val) }
  const uploadBg = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true); setError(null)
    try {
      const path = `backgrounds/${user.id}-${Date.now()}-${file.name.replace(/[^\w.\-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('task-files').upload(path, file)
      if (upErr) throw upErr
      const url = supabase.storage.from('task-files').getPublicUrl(path).data.publicUrl
      pickBg(url)
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen de fondo.')
    } finally {
      setBusy(false)
      if (bgFileRef.current) bgFileRef.current.value = ''
    }
  }

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
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full btn-brand flex items-center justify-center shadow-md border-2"
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
            className="text-sm font-medium px-3.5 py-2 rounded-ios-sm btn-brand disabled:opacity-50">
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
        <div className="w-full flex items-center justify-between px-4 py-3.5 border-b hairline">
          <span className="flex items-center gap-3 text-sm font-medium">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            Modo oscuro
          </span>
          <Switch checked={theme === 'dark'} onChange={toggle} ariaLabel="Modo oscuro" />
        </div>
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
        <div className="w-full flex items-center justify-between px-4 py-3.5 border-b hairline">
          <span className="flex items-center gap-3 text-sm font-medium">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
            Sonido de notificaciones
          </span>
          <Switch checked={sound} onChange={(v) => { setSound(v); setNotifSound(v); if (v) playNotificationSound() }} ariaLabel="Sonido de notificaciones" />
        </div>
        <div className="w-full flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-3 text-sm font-medium">
            <Sparkles size={18} />
            Efecto cristal (Liquid Glass)
          </span>
          <Switch checked={glass} onChange={(v) => { setGlassState(v); setGlass(v) }} ariaLabel="Efecto cristal" />
        </div>
      </div>

      <div className="surface rounded-ios border hairline p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Image size={18} />
            <span className="text-sm font-medium">Fondo</span>
          </div>
          <button onClick={() => bgFileRef.current?.click()} disabled={busy}
            className="text-xs font-medium px-3 py-1.5 rounded-full surface-2 text-2 disabled:opacity-50">
            Subir imagen
          </button>
          <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={uploadBg} />
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {BG_PRESETS.map(opt => {
            const active = bg === opt.css
            return (
              <button key={opt.id} onClick={() => pickBg(opt.css)}
                className={`relative h-16 rounded-ios-sm border overflow-hidden ${active ? 'ring-2 ring-brand-light border-transparent' : 'hairline'}`}
                style={opt.css ? { backgroundImage: opt.css, backgroundSize: 'cover' } : { background: 'var(--surface-2)' }}>
                <span className={`absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium ${opt.css ? 'text-white drop-shadow' : 'text-2'}`}>
                  {opt.label}
                </span>
              </button>
            )
          })}
          {bg && /^https?:|^data:/.test(bg) && (
            <button onClick={() => pickBg(bg)}
              className="relative h-16 rounded-ios-sm overflow-hidden ring-2 ring-brand-light"
              style={{ backgroundImage: `url("${bg}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow">Tu imagen</span>
            </button>
          )}
        </div>
        <p className="text-[11px] text-2 mt-2.5">Un fondo hace que el efecto cristal luzca mejor. Se guarda en este dispositivo.</p>
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
