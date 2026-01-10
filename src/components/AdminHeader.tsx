// Este componente ahora es un wrapper para mantener compatibilidad
// Se recomienda usar DynamicHeader directamente
import DynamicHeader from './DynamicHeader'

interface AdminHeaderProps {
  title?: string // Mantenido para compatibilidad, pero no se usa
  icon?: string // Mantenido para compatibilidad, pero no se usa
}

export default function AdminHeader({ title, icon }: AdminHeaderProps) {
  // AdminHeader usa rutas, no vistas internas
  return <DynamicHeader />
}

