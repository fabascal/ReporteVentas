// Este componente ahora es un wrapper para mantener compatibilidad
// Se recomienda usar DynamicHeader directamente
import DynamicHeader from './DynamicHeader'

export type VistaActiva = 'dashboard' | 'revision' | 'historial'

interface GerenteZonaHeaderProps {
  vistaActiva: VistaActiva
  onChangeVista: (vista: VistaActiva) => void
}

export default function GerenteZonaHeader({
  vistaActiva,
  onChangeVista,
}: GerenteZonaHeaderProps) {
  return <DynamicHeader activeViewId={vistaActiva} onViewChange={onChangeVista} />
}