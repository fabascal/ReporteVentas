/**
 * Utilidades para formatear fechas con conversión correcta de UTC a zona horaria local
 */

/**
 * Convierte una fecha UTC a la zona horaria local y la formatea
 * @param fecha - Fecha en formato string (ISO o UTC)
 * @param options - Opciones de formato (por defecto: fecha y hora completa)
 * @returns Fecha formateada en zona horaria local
 */
export const formatFechaLocal = (
  fecha: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!fecha) return 'N/A'
  
  try {
    // Si es string, asegurarse de que se interprete correctamente como UTC
    let date: Date
    if (typeof fecha === 'string') {
      let fechaStr = fecha.trim()
      
      // PostgreSQL devuelve TIMESTAMP sin zona horaria, que debemos interpretar como UTC
      // Formato: "2026-01-13T02:58:12" o "2026-01-13T02:58:12.123" o "2026-01-13 02:58:12"
      // También puede venir como "2026-01-13T02:58:12.000" o con milisegundos
      
      // Si ya tiene 'Z' o offset (+/-), usarla tal cual
      if (fechaStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(fechaStr)) {
        date = new Date(fechaStr)
      } else {
        // PostgreSQL devuelve TIMESTAMP sin zona horaria, que debemos interpretar como UTC
        // Formato: "2026-01-13T02:58:12" o "2026-01-13T02:58:12.123" o "2026-01-13 02:58:12"
        // También puede venir como "2026-01-13T02:58:12.000" o con milisegundos
        
        // Normalizar: reemplazar espacio por 'T' si es necesario
        fechaStr = fechaStr.replace(' ', 'T')
        
        // Si no tiene 'Z' ni offset, AGREGAR 'Z' SIEMPRE para forzar interpretación como UTC
        // Esto es crítico: sin 'Z', JavaScript interpreta la fecha como hora local
        // PostgreSQL siempre devuelve TIMESTAMP en UTC, así que debemos forzar la interpretación
        if (!fechaStr.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(fechaStr)) {
          // Si parece ser una fecha ISO (tiene 'T' o tiene formato YYYY-MM-DD), agregar 'Z'
          // Ser más permisivo: cualquier fecha que tenga formato ISO debe ser UTC
          if (fechaStr.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
            fechaStr = fechaStr + 'Z'
          }
        }
        
        date = new Date(fechaStr)
        
        // Si la fecha resultante es inválida, intentar parsear sin agregar 'Z' como último recurso
        if (isNaN(date.getTime())) {
          // Intentar parsear directamente (puede que ya tenga zona horaria o formato diferente)
          date = new Date(fecha)
        }
      }
    } else {
      date = fecha
    }

    // Validar que la fecha sea válida
    if (isNaN(date.getTime())) {
      console.warn('Fecha inválida:', fecha)
      return 'Fecha inválida'
    }

    // Si options tiene hour/minute/second explícitamente como undefined (no solo ausente),
    // significa que solo queremos la fecha sin hora
    const soloFecha = options && options.hour === undefined && options.minute === undefined && options.second === undefined
    
    if (soloFecha) {
      // Para solo fecha, usar métodos locales directamente
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${day}/${month}/${year}`
    } else {
      // Usar métodos get*() que SÍ convierten automáticamente a zona horaria local
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      let hours = date.getHours()
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      // Convertir a formato 12 horas con AM/PM
      const ampm = hours >= 12 ? 'p.m.' : 'a.m.'
      hours = hours % 12
      hours = hours ? hours : 12 // La hora '0' debe ser '12'
      const hoursStr = String(hours).padStart(2, '0')
      
      return `${day}/${month}/${year}, ${hoursStr}:${minutes}:${seconds} ${ampm}`
    }
  } catch (error) {
    console.error('Error al formatear fecha:', error, fecha)
    return 'Error al formatear fecha'
  }
}

/**
 * Formatea solo la fecha (sin hora) en zona horaria local
 * @param fecha - Fecha en formato string (ISO o UTC)
 * @returns Fecha formateada (DD/MM/YYYY)
 */
export const formatFechaSolo = (
  fecha: string | Date | null | undefined
): string => {
  if (!fecha) return 'N/A'
  
  return formatFechaLocal(fecha, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: undefined,
    minute: undefined,
    second: undefined,
    hour12: undefined,
  })
}

/**
 * Formatea fecha y hora en zona horaria local
 * @param fecha - Fecha en formato string (ISO o UTC)
 * @returns Fecha y hora formateada (DD/MM/YYYY, HH:MM:SS AM/PM)
 */
export const formatFechaHora = (
  fecha: string | Date | null | undefined
): string => {
  return formatFechaLocal(fecha)
}
