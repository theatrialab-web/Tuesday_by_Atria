import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Brand } from '../components/ui'

export default function Login() {
  const { signInWithGoogle } = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    // Los errores de OAuth vuelven en la query o en el hash de la URL.
    const params = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const code = params.get('error') || hash.get('error')
    const desc = params.get('error_description') || hash.get('error_description') || ''
    if (!code) return

    const blocked = /saving new user|Database error|not authorized|no autorizado/i.test(desc)
    setError(blocked
      ? 'Tu correo no esta autorizado para entrar. Si crees que es un error, contacta al administrador.'
      : 'No se pudo iniciar sesion. Intentalo de nuevo.')

    // Limpiar la URL para que el error no quede pegado al recargar.
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  return (
    <div className="min-h-dvh flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #290880 0%, #4318C9 55%, #1A0550 100%)' }}>
      <div className="w-full max-w-sm surface rounded-ios p-8 flex flex-col items-center gap-6 anim-pop">
        <img src="/favicon.svg" alt="Tuesday" className="h-16 w-auto" />
        <div className="text-center flex flex-col items-center gap-2">
          <Brand logoHeight={20} />
          <p className="text-sm text-2 mt-1">Tableros, tareas y equipo en un solo lugar.</p>
        </div>

        {error && (
          <div className="w-full flex items-start gap-2.5 rounded-ios-sm border border-[#E2445C]/40 bg-[#E2445C]/10 px-3.5 py-3 text-left">
            <AlertCircle size={17} className="text-[#E2445C] shrink-0 mt-0.5" />
            <p className="text-sm text-[#E2445C]">{error}</p>
          </div>
        )}

        <button onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-ios-sm border hairline font-semibold text-sm hover:surface-2 active:scale-[.98] transition-transform">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.16-3.16A11 11 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>
          Continuar con Google
        </button>
      </div>
    </div>
  )
}
