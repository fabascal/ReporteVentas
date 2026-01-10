// Este componente ahora es un wrapper para mantener compatibilidad
// Se recomienda usar DynamicHeader directamente
import DynamicHeader from './DynamicHeader'

export type VistaActivaGerenteEstacion = 'dashboard' | 'reportes' | 'nuevaCaptura' | 'historial'

interface GerenteEstacionHeaderProps {
  vistaActiva: VistaActivaGerenteEstacion
  onChangeVista: (vista: VistaActivaGerenteEstacion) => void
}

export default function GerenteEstacionHeader({
  vistaActiva,
  onChangeVista,
}: GerenteEstacionHeaderProps) {
  return <DynamicHeader activeViewId={vistaActiva} onViewChange={onChangeVista} />
}