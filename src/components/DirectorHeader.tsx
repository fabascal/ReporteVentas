// Este componente ahora es un wrapper para mantener compatibilidad
// Se recomienda usar DynamicHeader directamente
import DynamicHeader from './DynamicHeader'

export default function DirectorHeader() {
  // Director solo tiene una vista, pero usamos el sistema dinámico para consistencia
  return <DynamicHeader activeViewId="resumen" />
}