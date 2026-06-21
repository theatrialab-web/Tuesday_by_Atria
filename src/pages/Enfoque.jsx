import { Play, Pause, RotateCcw, SkipForward, Brain, Coffee, Minus, Plus } from 'lucide-react'
import { usePomodoro, fmt } from '../contexts/PomodoroContext'
import { Ring } from '../components/PomodoroWidget'

const WORK_COLOR = '#4318C9'
const BREAK_COLOR = '#00C875'

export default function Enfoque() {
  const p = usePomodoro()
  if (!p) return null
  const color = p.mode === 'work' ? WORK_COLOR : BREAK_COLOR
  const Icon = p.mode === 'work' ? Brain : Coffee

  const Stepper = ({ label, value, onChange, unit }) => (
    <div className="surface rounded-ios border hairline px-4 py-3 flex items-center justify-between gap-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(value - 1)} disabled={p.running}
          className="w-7 h-7 grid place-items-center rounded-full surface-2 text-2 disabled:opacity-40"><Minus size={14} /></button>
        <span className="w-12 text-center text-sm font-semibold tabular-nums">{value} {unit}</span>
        <button onClick={() => onChange(value + 1)} disabled={p.running}
          className="w-7 h-7 grid place-items-center rounded-full surface-2 text-2 disabled:opacity-40"><Plus size={14} /></button>
      </div>
    </div>
  )

  return (
    <div className="p-5 sm:p-8 max-w-md mx-auto flex flex-col items-center">
      <div className="text-center mb-2">
        <h1 className="text-2xl font-semibold">Enfoque</h1>
        <p className="text-sm text-2">Técnica Pomodoro · concentración por bloques</p>
      </div>

      <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full my-4"
        style={{ color, backgroundColor: color + '1f' }}>
        <Icon size={15} /> {p.mode === 'work' ? 'Tiempo de enfoque' : 'Descanso'}
      </span>

      <Ring progress={p.progress} size={260} stroke={14} color={color}>
        <div className="text-center">
          <p className="text-6xl font-bold tabular-nums tracking-tight">{fmt(p.secondsLeft)}</p>
          <p className="text-sm text-2 mt-1">
            {p.sessions} {p.sessions === 1 ? 'sesión completada' : 'sesiones completadas'}
          </p>
        </div>
      </Ring>

      <div className="flex items-center justify-center gap-3 mt-8">
        <button onClick={p.reset} aria-label="Reiniciar"
          className="p-3.5 rounded-full surface border hairline text-2 hover:text-1 active:scale-95 transition-transform">
          <RotateCcw size={18} />
        </button>
        <button onClick={p.toggle}
          className="px-8 py-3.5 rounded-full text-white font-semibold flex items-center gap-2 active:scale-95 transition-transform shadow-lg"
          style={{ backgroundColor: color }}>
          {p.running ? <><Pause size={18} /> Pausar</> : <><Play size={18} /> Iniciar</>}
        </button>
        <button onClick={p.skip} aria-label="Saltar fase"
          className="p-3.5 rounded-full surface border hairline text-2 hover:text-1 active:scale-95 transition-transform">
          <SkipForward size={18} />
        </button>
      </div>

      <div className="w-full mt-10 flex flex-col gap-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-2">Duraciones</p>
        <Stepper label="Enfoque" value={p.workMin} unit="min" onChange={(v) => p.applyDurations(v, p.breakMin)} />
        <Stepper label="Descanso" value={p.breakMin} unit="min" onChange={(v) => p.applyDurations(p.workMin, v)} />
        {p.running && <p className="text-[11px] text-2 text-center">Pausa el temporizador para cambiar las duraciones.</p>}
      </div>
    </div>
  )
}
