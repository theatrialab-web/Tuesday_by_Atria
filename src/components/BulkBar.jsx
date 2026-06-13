import { X } from 'lucide-react'

// Barra flotante que aparece cuando hay elementos seleccionados.
// children = botones de acción específicos de cada contexto.
export function BulkBar({ count, onClear, children }) {
  if (!count) return null
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-40 anim-pop">
      <div className="flex items-center gap-2 surface border hairline shadow-2xl rounded-full pl-4 pr-2 py-2">
        <span className="text-sm font-semibold whitespace-nowrap">{count} seleccionada{count !== 1 ? 's' : ''}</span>
        <span className="w-px h-5 hairline border-l mx-1" />
        {children}
        <button onClick={onClear} aria-label="Cancelar selección"
          className="p-1.5 rounded-full surface-2 text-2 hover:opacity-80 ml-1">
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
