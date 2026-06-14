import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { WorkspaceIcon, Brand } from '../components/ui'
import { CreateWorkspaceModal } from '../components/CreateModals'

export default function Home() {
  const { profile } = useAuth()
  const { workspaces, loading } = useWorkspaces()
  const [createOpen, setCreateOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return workspaces
    return workspaces.filter(ws => ws.name.toLowerCase().includes(q))
  }, [workspaces, query])

  return (
    <div className="p-5 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-5"><Brand logoHeight={20} /></div>
      <h1 className="text-2xl font-semibold mb-1">Hola, {profile?.full_name?.split(' ')[0] || ''} 👋</h1>
      <p className="text-sm text-2 mb-4">Tus workspaces</p>

      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-2" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar workspace…"
          className="w-full pl-9 pr-9 py-2.5 rounded-ios-sm surface border hairline text-sm placeholder:text-2" />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full surface-2 text-2">
            <X size={13} />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-2">Cargando…</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(ws => (
            <button key={ws.id} onClick={() => navigate(`/workspace/${ws.id}`)}
              className="surface rounded-ios border hairline p-4 flex flex-col items-start gap-3 text-left active:scale-[.98] transition-transform hover:shadow-sm">
              <WorkspaceIcon icon={ws.icon} color={ws.color} size={42} />
              <span className="font-semibold text-sm leading-tight break-words line-clamp-3 w-full">{ws.name}</span>
            </button>
          ))}
          {!query && (
            <button onClick={() => setCreateOpen(true)}
              className="rounded-ios border-2 border-dashed hairline p-4 flex flex-col items-center justify-center gap-2 text-2 min-h-[110px] active:scale-[.98] transition-transform hover:surface">
              <Plus size={22} />
              <span className="text-sm font-medium">Nuevo workspace</span>
            </button>
          )}
          {query && filtered.length === 0 && (
            <p className="text-sm text-2 col-span-full">No hay workspaces que coincidan con "{query}".</p>
          )}
        </div>
      )}

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)}
        onCreated={(ws) => { setCreateOpen(false); navigate(`/workspace/${ws.id}`) }} />
    </div>
  )
}
