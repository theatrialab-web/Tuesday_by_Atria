import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Home from './pages/Home'
import Workspace from './pages/Workspace'
import Board from './pages/Board'
import MisTareas from './pages/MisTareas'
import Calendario from './pages/Calendario'
import Cobros from './pages/Cobros'
import Notificaciones from './pages/Notificaciones'
import Perfil from './pages/Perfil'

function Protected() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!session) return <Login />

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mis-tareas" element={<MisTareas />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/cobros" element={<Cobros />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/workspace/:id" element={<Workspace />} />
        <Route path="/board/:id" element={<Board />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Protected />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
