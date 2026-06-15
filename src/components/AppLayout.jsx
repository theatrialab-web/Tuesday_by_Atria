import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Home, CircleCheck, Bell, CircleUser, Plus, PanelLeftClose, PanelLeftOpen,
  Moon, Sun, LogOut, CalendarDays, ChevronRight, ChevronDown, Search, X, CircleDot, CreditCard, Video, LayoutGrid,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useBoards } from '../hooks/useBoards'
import { useNotifications } from '../hooks/useMyTasks'
import { Avatar, WorkspaceIcon, Brand, isEmojiIcon } from './ui'
import { NotificationToaster } from './NotificationToaster'
import { TaskQuickView } from './TaskQuickView'
import { CreateWorkspaceModal } from './CreateModals'


function SidebarSearch({ workspaces }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState({ ws: [], boards: [], tasks: [] })
  const navigate = useNavigate()

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setResults({ ws: [], boards: [], tasks: [] }); return }
    let cancelled = false
    const t = setTimeout(async () => {
      const lc = term.toLowerCase()
      const ws = workspaces.filter(w => w.name.toLowerCase().includes(lc)).slice(0, 5)
      const [boardsRes, tasksRes] = await Promise.all([
        supabase.from('boards').select('id, name, icon, color').ilike('name', `%${term}%`).limit(6),
        supabase.from('tasks').select('id, title, board_id').ilike('title', `%${term}%`).limit(8),
      ])
      if (!cancelled) setResults({ ws, boards: boardsRes.data || [], tasks: tasksRes.data || [] })
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [q, workspaces])

  const go = (path) => { setQ(''); setResults({ ws: [], boards: [], tasks: [] }); navigate(path) }
  const has = results.ws.length || results.boards.length || results.tasks.length

  return (
    <div className="px-1 mb-2">
      <div className="flex items-center gap-2 px-2.5 py-2 rounded-ios-sm surface-2">
        <Search size={14} className="text-2 shrink-0" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar…"
          className="bg-transparent text-sm outline-none w-full min-w-0" />
        {q && <button onClick={() => setQ('')} aria-label="Limpiar"><X size={13} className="text-2" /></button>}
      </div>
      {q.trim().length >= 2 && (
        <div className="mt-1 max-h-80 overflow-y-auto rounded-ios-sm surface border hairline shadow-lg p-1">
          {!has && <p className="text-xs text-2 px-2 py-3 text-center">Sin resultados</p>}
          {results.ws.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-2 px-2 pt-1.5 pb-0.5">Workspaces</p>
              {results.ws.map(w => (
                <button key={w.id} onClick={() => go(`/workspace/${w.id}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-ios-sm text-sm hover:surface-2 text-left">
                  <WorkspaceIcon icon={w.icon} color={w.color} size={22} />
                  <span className="truncate">{w.name}</span>
                </button>
              ))}
            </>
          )}
          {results.boards.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-2 px-2 pt-1.5 pb-0.5">Boards</p>
              {results.boards.map(b => (
                <button key={b.id} onClick={() => go(`/board/${b.id}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-ios-sm text-sm hover:surface-2 text-left">
                  <span className="text-base leading-none shrink-0">{isEmojiIcon(b.icon) ? b.icon : '📋'}</span>
                  <span className="truncate">{b.name}</span>
                </button>
              ))}
            </>
          )}
          {results.tasks.length > 0 && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-2 px-2 pt-1.5 pb-0.5">Tareas</p>
              {results.tasks.map(t => (
                <button key={t.id} onClick={() => go(`/board/${t.board_id}?task=${t.id}`)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-ios-sm text-sm hover:surface-2 text-left">
                  <CircleDot size={13} className="text-2 shrink-0" />
                  <span className="truncate">{t.title}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function navItemCls(isActive) {
  return `flex items-center gap-3 px-3 py-2 rounded-ios-sm text-sm font-medium transition-colors ${
    isActive ? 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'text-2 hover:surface-2'
  }`
}

function BoardSubList({ wsId }) {
  const { boards, loading } = useBoards(wsId)
  return (
    <div className="ml-7 mt-0.5 mb-1 flex flex-col gap-0.5 border-l hairline pl-2">
      {loading && <span className="text-xs text-2 px-2 py-1">Cargando…</span>}
      {!loading && boards.length === 0 && <span className="text-xs text-2 px-2 py-1">Sin boards</span>}
      {boards.map(b => (
        <NavLink key={b.id} to={`/board/${b.id}`}
          className={({ isActive }) => `flex items-center gap-2 px-2 py-1.5 rounded-ios-sm text-sm transition-colors ${
            isActive ? 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'text-2 hover:surface-2'
          }`}>
          <span className="text-base leading-none shrink-0">{isEmojiIcon(b.icon) ? b.icon : '📋'}</span>
          <span className="truncate">{b.name}</span>
        </NavLink>
      ))}
    </div>
  )
}

function WorkspaceNavItem({ ws, collapsed }) {
  const [open, setOpen] = useState(false)
  if (collapsed) {
    return (
      <NavLink to={`/workspace/${ws.id}`} className={({ isActive }) => navItemCls(isActive)}>
        <WorkspaceIcon icon={ws.icon} color={ws.color} size={24} />
      </NavLink>
    )
  }
  return (
    <div>
      <div className="flex items-center">
        <NavLink to={`/workspace/${ws.id}`} className={({ isActive }) => navItemCls(isActive) + ' flex-1 min-w-0'}>
          <WorkspaceIcon icon={ws.icon} color={ws.color} size={24} />
          <span className="truncate">{ws.name}</span>
        </NavLink>
        <button onClick={() => setOpen(o => !o)} aria-label="Mostrar boards"
          className="p-1.5 rounded-ios-sm text-2 hover:surface-2 shrink-0">
          <ChevronDown size={15} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <BoardSubList wsId={ws.id} />}
    </div>
  )
}

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { profile, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { workspaces } = useWorkspaces()
  const { unreadCount } = useNotifications()

  return (
    <aside className={`hidden md:flex flex-col surface border-r hairline transition-all ${collapsed ? 'w-[68px]' : 'w-64'} shrink-0 h-dvh sticky top-0`}>
      <div className="flex items-center justify-between p-3">
        {!collapsed && <Brand logoHeight={15} className="px-1" />}
        <button onClick={() => setCollapsed(c => !c)} aria-label="Colapsar menú"
          className="p-2 rounded-ios-sm text-2 hover:surface-2">
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        <NavLink to="/" end className={({ isActive }) => navItemCls(isActive)}>
          <Home size={18} strokeWidth={1.75} className="shrink-0" />{!collapsed && 'Inicio'}
        </NavLink>
        <NavLink to="/mis-tareas" className={({ isActive }) => navItemCls(isActive)}>
          <CircleCheck size={18} strokeWidth={1.75} className="shrink-0" />{!collapsed && 'Mis Tareas'}
        </NavLink>
        <NavLink to="/calendario" className={({ isActive }) => navItemCls(isActive)}>
          <CalendarDays size={18} strokeWidth={1.75} className="shrink-0" />{!collapsed && 'Calendario'}
        </NavLink>
        <NavLink to="/reuniones" className={({ isActive }) => navItemCls(isActive)}>
          <Video size={18} strokeWidth={1.75} className="shrink-0" />{!collapsed && 'Reuniones'}
        </NavLink>
        <NavLink to="/cobros" className={({ isActive }) => navItemCls(isActive)}>
          <CreditCard size={18} strokeWidth={1.75} className="shrink-0" />{!collapsed && 'Cobros'}
        </NavLink>
        <NavLink to="/notificaciones" className={({ isActive }) => navItemCls(isActive)}>
          <span className="relative shrink-0">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#E2445C] text-white text-[9px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          {!collapsed && 'Notificaciones'}
        </NavLink>
      </nav>

      <div className="mt-4 px-2 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-2">Workspaces</p>
            <button onClick={() => window.dispatchEvent(new CustomEvent('open-create-workspace'))}
              aria-label="Nuevo workspace" className="p-1 rounded-ios-sm text-2 hover:surface-2 hover:text-brand dark:hover:text-brand-light">
              <Plus size={15} />
            </button>
          </div>
        )}
        {!collapsed && <SidebarSearch workspaces={workspaces} />}
        <div className="flex flex-col gap-1">
          {workspaces.map(ws => (
            <WorkspaceNavItem key={ws.id} ws={ws} collapsed={collapsed} />
          ))}
        </div>
      </div>

      <div className="p-2 border-t hairline flex flex-col gap-1">
        <button onClick={toggle} className={navItemCls(false)}>
          {theme === 'light' ? <Moon size={18} className="shrink-0" /> : <Sun size={18} className="shrink-0" />}
          {!collapsed && (theme === 'light' ? 'Modo oscuro' : 'Modo claro')}
        </button>
        <NavLink to="/perfil" className={({ isActive }) => navItemCls(isActive)}>
          <Avatar profile={profile} size={24} />
          {!collapsed && <span className="truncate">{profile?.full_name || 'Perfil'}</span>}
        </NavLink>
        <button onClick={signOut} className={navItemCls(false)}>
          <LogOut size={18} className="shrink-0" />{!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}

function BottomNav({ onCreate }) {
  const { unreadCount } = useNotifications()
  const [moreOpen, setMoreOpen] = useState(false)
  const item = 'flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] gap-0.5'
  const active = ({ isActive }) => `${item} ${isActive ? 'text-brand dark:text-white' : 'text-2'}`
  const sheetLink = ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-ios-sm text-sm font-medium ${isActive ? 'bg-brand-soft dark:bg-brand-softDark text-brand dark:text-white' : 'surface-2'}`
  return (
    <>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 surface border-t hairline flex items-stretch pb-[env(safe-area-inset-bottom)]">
        <NavLink to="/" end className={active}><Home size={21} />Inicio</NavLink>
        <NavLink to="/mis-tareas" className={active}><CircleCheck size={21} />Tareas</NavLink>
        <button onClick={onCreate} aria-label="Crear"
          className="flex items-center justify-center w-14 -mt-4 mx-1">
          <span className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <Plus size={24} />
          </span>
        </button>
        <NavLink to="/notificaciones" className={active}>
          <span className="relative">
            <Bell size={21} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#E2445C] text-white text-[9px] font-semibold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          Avisos
        </NavLink>
        <button onClick={() => setMoreOpen(true)} className={`${item} text-2`}><LayoutGrid size={21} />Más</button>
        <NavLink to="/perfil" className={active}><CircleUser size={21} />Perfil</NavLink>
      </nav>

      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30 anim-fade" />
          <div className="relative surface w-full rounded-t-ios p-4 anim-sheet shadow-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full surface-2 mx-auto mb-4" />
            <div className="flex flex-col gap-1.5">
              <NavLink to="/calendario" onClick={() => setMoreOpen(false)} className={sheetLink}><CalendarDays size={18} /> Calendario</NavLink>
              <NavLink to="/reuniones" onClick={() => setMoreOpen(false)} className={sheetLink}><Video size={18} /> Reuniones</NavLink>
              <NavLink to="/cobros" onClick={() => setMoreOpen(false)} className={sheetLink}><CreditCard size={18} /> Cobros</NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AppLayout({ children }) {
  const [createWs, setCreateWs] = useState(false)
  const [quickTask, setQuickTask] = useState(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const h = () => setCreateWs(true)
    window.addEventListener('open-create-workspace', h)
    return () => window.removeEventListener('open-create-workspace', h)
  }, [])

  // El "+" del bottom nav es contextual: en un board crea tarea (lo maneja
  // la propia página vía evento), en el resto crea workspace.
  const handleCreate = () => {
    if (location.pathname.startsWith('/board/')) {
      window.dispatchEvent(new CustomEvent('quick-create-task'))
    } else if (location.pathname.startsWith('/mis-tareas')) {
      window.dispatchEvent(new CustomEvent('quick-create-task'))
    } else if (location.pathname.startsWith('/workspace/')) {
      window.dispatchEvent(new CustomEvent('quick-create-board'))
    } else {
      setCreateWs(true)
    }
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      <BottomNav onCreate={handleCreate} />
      <NotificationToaster onOpenTask={setQuickTask} />
      {quickTask && (
        <TaskQuickView taskId={quickTask.taskId} boardId={quickTask.boardId}
          onClose={() => setQuickTask(null)} />
      )}
      <CreateWorkspaceModal open={createWs} onClose={() => setCreateWs(false)}
        onCreated={(ws) => { setCreateWs(false); navigate(`/workspace/${ws.id}`) }} />
    </div>
  )
}
