import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { playPomodoroSound } from '../lib/sound'

const PomodoroCtx = createContext(null)
export const usePomodoro = () => useContext(PomodoroCtx)

const KEY = 'pomodoro-v1'
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}

export function PomodoroProvider({ children }) {
  const saved = load()
  const [workMin, setWorkMin] = useState(saved.workMin || 25)
  const [breakMin, setBreakMin] = useState(saved.breakMin || 5)
  const [mode, setMode] = useState(saved.mode === 'break' ? 'break' : 'work')
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(saved.sessions || 0)
  const [secondsLeft, setSecondsLeft] = useState(
    typeof saved.secondsLeft === 'number' ? saved.secondsLeft : (saved.workMin || 25) * 60
  )
  const endRef = useRef(null)

  const total = (mode === 'work' ? workMin : breakMin) * 60

  // Persistir
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ workMin, breakMin, mode, sessions, secondsLeft }))
  }, [workMin, breakMin, mode, sessions, secondsLeft])

  const transition = () => {
    setMode(prevMode => {
      const nextMode = prevMode === 'work' ? 'break' : 'work'
      if (prevMode === 'work') setSessions(s => s + 1)
      const dur = (nextMode === 'work' ? workMin : breakMin) * 60
      endRef.current = Date.now() + dur * 1000
      setSecondsLeft(dur)
      playPomodoroSound(nextMode)
      return nextMode
    })
  }

  // Tick
  useEffect(() => {
    if (!running) return
    if (!endRef.current) endRef.current = Date.now() + secondsLeft * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      if (left <= 0) transition()
      else setSecondsLeft(left)
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const start = () => {
    if (running) return
    endRef.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }
  const pause = () => { setRunning(false); endRef.current = null }
  const toggle = () => (running ? pause() : start())

  const reset = () => {
    setRunning(false); endRef.current = null
    setMode('work'); setSecondsLeft(workMin * 60)
  }

  const skip = () => {
    endRef.current = null
    setMode(prev => {
      const next = prev === 'work' ? 'break' : 'work'
      const dur = (next === 'work' ? workMin : breakMin) * 60
      setSecondsLeft(dur)
      if (running) endRef.current = Date.now() + dur * 1000
      playPomodoroSound(next)
      return next
    })
  }

  const applyDurations = (w, b) => {
    const nw = Math.min(120, Math.max(1, w))
    const nb = Math.min(60, Math.max(1, b))
    setWorkMin(nw); setBreakMin(nb)
    if (!running) {
      setSecondsLeft((mode === 'work' ? nw : nb) * 60)
    }
  }

  const value = {
    workMin, breakMin, mode, running, sessions, secondsLeft, total,
    progress: total > 0 ? secondsLeft / total : 0,
    start, pause, toggle, reset, skip, applyDurations,
  }
  return <PomodoroCtx.Provider value={value}>{children}</PomodoroCtx.Provider>
}

export function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
