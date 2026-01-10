import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { reportesService } from '../services/reportesService'

interface FormData {
  estacionId: string
  fecha: string
  aceites?: number // Campo único a nivel de reporte (en pesos)
  premiumPrecio: number
  premiumLitros: number
  premiumIib?: number
  premiumCompras?: number
  premiumCct?: number
  premiumVDsc?: number
  premiumIffb?: number
  magnaPrecio: number
  magnaLitros: number
  magnaIib?: number
  magnaCompras?: number
  magnaCct?: number
  magnaVDsc?: number
  magnaIffb?: number
  dieselPrecio: number
  dieselLitros: number
  dieselIib?: number
  dieselCompras?: number
  dieselCct?: number
  dieselVDsc?: number
  dieselIffb?: number
}

interface FormularioCapturaVentasProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function FormularioCapturaVentas({ onSuccess, onCancel }: FormularioCapturaVentasProps) {
  const [estaciones, setEstaciones] = useState<Array<{ id: string; nombre: string; zonaNombre?: string; tienePremium?: boolean; tieneMagna?: boolean; tieneDiesel?: boolean }>>([])
  const [estacionSeleccionada, setEstacionSeleccionada] = useState<{ tienePremium?: boolean; tieneMagna?: boolean; tieneDiesel?: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    loadEstaciones()
  }, [])

  const loadEstaciones = async () => {
    try {
      const data = await reportesService.getEstaciones()
      setEstaciones(data)
    } catch (error) {
      console.error('Error al cargar estaciones:', error)
    }
  }

  // Estado para rastrear qué campos están enfocados (sin formato)
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set())

  // Función para formatear números con separadores de miles
  const formatNumber = (value: string | number): string => {
    if (!value && value !== 0) return ''
    const numStr = value.toString().replace(/,/g, '')
    const num = parseFloat(numStr)
    if (isNaN(num)) return ''
    return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Función para convertir valor formateado de vuelta a número (sin formato)
  const parseFormattedNumber = (value: string): string => {
    if (!value) return ''
    // Remover separadores de miles y mantener solo números y punto decimal
    return value.replace(/,/g, '')
  }

  // Handler para cuando el campo pierde el foco - formatear
  const handleBlur = (fieldName: keyof FormData, value: string) => {
    const fieldKey = fieldName as string
    
    // Limpiar valor temporal
    setTempValues((prev) => {
      const next = { ...prev }
      delete next[fieldKey]
      return next
    })
    
    const cleaned = parseFormattedNumber(value)
    const numValue = parseFloat(cleaned) || 0
    setValue(fieldName, numValue, { shouldValidate: true })
    setFocusedFields((prev) => {
      const next = new Set(prev)
      next.delete(fieldKey)
      return next
    })
  }

  // Handler para cuando el campo gana el foco - quitar formato
  const handleFocus = (fieldName: keyof FormData) => {
    setFocusedFields((prev) => new Set(prev).add(fieldName as string))
  }

  // Handler para cambios mientras se escribe - sin formato
  const handleInputChange = (fieldName: keyof FormData, value: string) => {
    const fieldKey = fieldName as string
    
    // Permitir solo números y punto decimal
    let cleaned = value.replace(/[^0-9.]/g, '')
    
    // Evitar múltiples puntos decimales - mantener solo el primero
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Guardar valor temporal para mostrar mientras se escribe
    setTempValues((prev) => ({ ...prev, [fieldKey]: cleaned }))
    
    // Si el valor está vacío, limpiar
    if (cleaned === '') {
      setValue(fieldName, 0, { shouldValidate: false })
      setTempValues((prev) => {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      })
      return
    }
    
    // Si solo tiene un punto o termina en punto, mantener el valor temporal
    if (cleaned === '.' || cleaned.endsWith('.')) {
      setValue(fieldName, 0, { shouldValidate: false })
      return
    }
    
    // Guardar el valor numérico mientras se escribe
    const numValue = parseFloat(cleaned) || 0
    setValue(fieldName, numValue, { shouldValidate: false })
    
    // Limpiar valor temporal si es un número válido completo
    if (!isNaN(numValue) && !cleaned.endsWith('.')) {
      setTempValues((prev) => {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      })
    }
  }

  // Estado para valores temporales mientras se escribe (para permitir punto decimal)
  const [tempValues, setTempValues] = useState<Record<string, string>>({})

  // Función para obtener el valor a mostrar
  const getDisplayValue = (fieldName: keyof FormData, value: number | undefined): string => {
    const fieldKey = fieldName as string
    
    // Si hay un valor temporal (mientras se escribe), usarlo
    if (tempValues[fieldKey] !== undefined) {
      return tempValues[fieldKey]
    }
    
    // Permitir mostrar 0 explícitamente
    if (value === undefined || value === null) return ''
    
    // Si el campo está enfocado, mostrar sin formato
    if (focusedFields.has(fieldKey)) {
      return value.toString()
    }
    
    // Si no está enfocado, mostrar con formato
    return formatNumber(value)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Verificar si es el primer día del mes para I.I.B.
      const fechaObj = new Date(data.fecha)
      const esPrimerDia = fechaObj.getDate() === 1

      const estacion = estaciones.find(est => est.id === data.estacionId)
      
      await reportesService.createReporte({
        estacionId: data.estacionId,
        fecha: data.fecha,
        aceites: data.aceites ? parseFloat(data.aceites.toString()) : undefined, // Campo único a nivel de reporte
        premium: estacion?.tienePremium !== false ? {
          precio: parseFloat(data.premiumPrecio.toString()),
          litros: parseFloat(data.premiumLitros.toString()),
          iib: esPrimerDia && data.premiumIib ? parseFloat(data.premiumIib.toString()) : undefined,
          compras: data.premiumCompras ? parseFloat(data.premiumCompras.toString()) : undefined,
          cct: data.premiumCct ? parseFloat(data.premiumCct.toString()) : undefined,
          vDsc: data.premiumVDsc ? parseFloat(data.premiumVDsc.toString()) : undefined,
          iffb: data.premiumIffb ? parseFloat(data.premiumIffb.toString()) : undefined,
        } : { precio: 0, litros: 0 },
        magna: estacion?.tieneMagna !== false ? {
          precio: parseFloat(data.magnaPrecio.toString()),
          litros: parseFloat(data.magnaLitros.toString()),
          iib: esPrimerDia && data.magnaIib ? parseFloat(data.magnaIib.toString()) : undefined,
          compras: data.magnaCompras ? parseFloat(data.magnaCompras.toString()) : undefined,
          cct: data.magnaCct ? parseFloat(data.magnaCct.toString()) : undefined,
          vDsc: data.magnaVDsc ? parseFloat(data.magnaVDsc.toString()) : undefined,
          iffb: data.magnaIffb ? parseFloat(data.magnaIffb.toString()) : undefined,
        } : { precio: 0, litros: 0 },
        diesel: estacion?.tieneDiesel !== false ? {
          precio: parseFloat(data.dieselPrecio.toString()),
          litros: parseFloat(data.dieselLitros.toString()),
          iib: esPrimerDia && data.dieselIib ? parseFloat(data.dieselIib.toString()) : undefined,
          compras: data.dieselCompras ? parseFloat(data.dieselCompras.toString()) : undefined,
          cct: data.dieselCct ? parseFloat(data.dieselCct.toString()) : undefined,
          vDsc: data.dieselVDsc ? parseFloat(data.dieselVDsc.toString()) : undefined,
          iffb: data.dieselIffb ? parseFloat(data.dieselIffb.toString()) : undefined,
        } : { precio: 0, litros: 0 },
      })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el reporte')
    } finally {
      setIsLoading(false)
    }
  }

  // Observar valores
  const premiumPrecioValue = watch('premiumPrecio')
  const premiumLitrosValue = watch('premiumLitros')
  const magnaPrecioValue = watch('magnaPrecio')
  const magnaLitrosValue = watch('magnaLitros')
  const dieselPrecioValue = watch('dieselPrecio')
  const dieselLitrosValue = watch('dieselLitros')

  return (
    <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="border-b border-[#e6e8eb] dark:border-slate-700 px-6 py-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-[#111418] dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1173d4]">edit_note</span>
          Detalles de la Venta
        </h3>
        <span className="text-xs text-[#617589] dark:text-slate-400 uppercase font-semibold tracking-wider">Folio #NEW</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 flex flex-col gap-8">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Row 1: Estación, Fecha & Aceites */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Estación *</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                store
              </span>
              <select
                {...register('estacionId', { required: 'Selecciona una estación' })}
                onChange={(e) => {
                  const estacion = estaciones.find(est => est.id === e.target.value)
                  setEstacionSeleccionada(estacion || null)
                }}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent transition-shadow"
              >
                <option value="">Seleccione una estación...</option>
                {estaciones.map((estacion) => (
                  <option key={estacion.id} value={estacion.id}>
                    {estacion.nombre} {estacion.zonaNombre ? `(${estacion.zonaNombre})` : ''}
                  </option>
                ))}
              </select>
            </div>
            {errors.estacionId && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.estacionId.message}</p>
            )}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Fecha de Transacción *</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                calendar_month
              </span>
              <input
                type="date"
                {...register('fecha', { required: 'La fecha es requerida' })}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent transition-shadow"
              />
            </div>
            {errors.fecha && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.fecha.message}</p>}
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Aceites (Pesos)</span>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                attach_money
              </span>
              <input
                type="text"
                {...register('aceites')}
                value={getDisplayValue('aceites', watch('aceites'))}
                onChange={(e) => handleInputChange('aceites', e.target.value)}
                onFocus={() => handleFocus('aceites')}
                onBlur={(e) => handleBlur('aceites', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </label>
        </div>

        {/* Premium */}
        {(!estacionSeleccionada || estacionSeleccionada.tienePremium !== false) && (
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-6 bg-red-50/30 dark:bg-red-900/10">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400">local_gas_station</span>
              Premium
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  attach_money
                </span>
                <input
                  type="text"
                  {...register('premiumPrecio', {
                    required: estacionSeleccionada?.tienePremium !== false ? 'El precio es requerido' : false,
                    min: { value: 0, message: 'El precio debe ser mayor a 0' },
                  })}
                  value={getDisplayValue('premiumPrecio', premiumPrecioValue)}
                  onChange={(e) => handleInputChange('premiumPrecio', e.target.value)}
                  onFocus={() => handleFocus('premiumPrecio')}
                  onBlur={(e) => handleBlur('premiumPrecio', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.premiumPrecio && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.premiumPrecio.message}</p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Litros vendidos *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  water_drop
                </span>
                <input
                  type="text"
                  {...register('premiumLitros', {
                    required: estacionSeleccionada?.tienePremium !== false ? 'Los litros son requeridos' : false,
                    min: { value: 0, message: 'Los litros deben ser mayor a 0' },
                  })}
                  value={getDisplayValue('premiumLitros', premiumLitrosValue)}
                  onChange={(e) => handleInputChange('premiumLitros', e.target.value)}
                  onFocus={() => handleFocus('premiumLitros')}
                  onBlur={(e) => handleBlur('premiumLitros', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.premiumLitros && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.premiumLitros.message}</p>
              )}
            </label>
          </div>
          {/* Nuevos campos para Premium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            {new Date(watch('fecha') || new Date().toISOString().split('T')[0]).getDate() === 1 && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.I.B. (Solo día 1)</span>
                <input
                  type="text"
                  {...register('premiumIib')}
                  value={getDisplayValue('premiumIib', watch('premiumIib'))}
                  onChange={(e) => handleInputChange('premiumIib', e.target.value)}
                  onFocus={() => handleFocus('premiumIib')}
                  onBlur={(e) => handleBlur('premiumIib', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Compras (C)</span>
              <input
                type="text"
                {...register('premiumCompras')}
                value={getDisplayValue('premiumCompras', watch('premiumCompras'))}
                onChange={(e) => handleInputChange('premiumCompras', e.target.value)}
                onFocus={() => handleFocus('premiumCompras')}
                onBlur={(e) => handleBlur('premiumCompras', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">CCT</span>
              <input
                type="text"
                {...register('premiumCct')}
                value={getDisplayValue('premiumCct', watch('premiumCct'))}
                onChange={(e) => handleInputChange('premiumCct', e.target.value)}
                onFocus={() => handleFocus('premiumCct')}
                onBlur={(e) => handleBlur('premiumCct', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">V. Dsc</span>
              <input
                type="text"
                {...register('premiumVDsc')}
                value={getDisplayValue('premiumVDsc', watch('premiumVDsc'))}
                onChange={(e) => handleInputChange('premiumVDsc', e.target.value)}
                onFocus={() => handleFocus('premiumVDsc')}
                onBlur={(e) => handleBlur('premiumVDsc', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.F.F.B.</span>
              <input
                type="text"
                {...register('premiumIffb')}
                value={getDisplayValue('premiumIffb', watch('premiumIffb'))}
                onChange={(e) => handleInputChange('premiumIffb', e.target.value)}
                onFocus={() => handleFocus('premiumIffb')}
                onBlur={(e) => handleBlur('premiumIffb', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
          </div>
        </div>
        )}

        {/* Magna */}
        {(!estacionSeleccionada || estacionSeleccionada.tieneMagna !== false) && (
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-6 bg-green-50/30 dark:bg-green-900/10">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">local_gas_station</span>
              Magna
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  attach_money
                </span>
                <input
                  type="text"
                  {...register('magnaPrecio', {
                    required: estacionSeleccionada?.tieneMagna !== false ? 'El precio es requerido' : false,
                    min: { value: 0, message: 'El precio debe ser mayor a 0' },
                  })}
                  value={getDisplayValue('magnaPrecio', magnaPrecioValue)}
                  onChange={(e) => handleInputChange('magnaPrecio', e.target.value)}
                  onFocus={() => handleFocus('magnaPrecio')}
                  onBlur={(e) => handleBlur('magnaPrecio', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.magnaPrecio && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.magnaPrecio.message}</p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Litros vendidos *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  water_drop
                </span>
                <input
                  type="text"
                  {...register('magnaLitros', {
                    required: estacionSeleccionada?.tieneMagna !== false ? 'Los litros son requeridos' : false,
                    min: { value: 0, message: 'Los litros deben ser mayor a 0' },
                  })}
                  value={getDisplayValue('magnaLitros', magnaLitrosValue)}
                  onChange={(e) => handleInputChange('magnaLitros', e.target.value)}
                  onFocus={() => handleFocus('magnaLitros')}
                  onBlur={(e) => handleBlur('magnaLitros', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.magnaLitros && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.magnaLitros.message}</p>
              )}
            </label>
          </div>
          {/* Nuevos campos para Magna */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            {new Date(watch('fecha') || new Date().toISOString().split('T')[0]).getDate() === 1 && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.I.B. (Solo día 1)</span>
                <input
                  type="text"
                  {...register('magnaIib')}
                  value={getDisplayValue('magnaIib', watch('magnaIib'))}
                  onChange={(e) => handleInputChange('magnaIib', e.target.value)}
                  onFocus={() => handleFocus('magnaIib')}
                  onBlur={(e) => handleBlur('magnaIib', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Compras (C)</span>
              <input
                type="text"
                {...register('magnaCompras')}
                value={getDisplayValue('magnaCompras', watch('magnaCompras'))}
                onChange={(e) => handleInputChange('magnaCompras', e.target.value)}
                onFocus={() => handleFocus('magnaCompras')}
                onBlur={(e) => handleBlur('magnaCompras', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">CCT</span>
              <input
                type="text"
                {...register('magnaCct')}
                value={getDisplayValue('magnaCct', watch('magnaCct'))}
                onChange={(e) => handleInputChange('magnaCct', e.target.value)}
                onFocus={() => handleFocus('magnaCct')}
                onBlur={(e) => handleBlur('magnaCct', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">V. Dsc</span>
              <input
                type="text"
                {...register('magnaVDsc')}
                value={getDisplayValue('magnaVDsc', watch('magnaVDsc'))}
                onChange={(e) => handleInputChange('magnaVDsc', e.target.value)}
                onFocus={() => handleFocus('magnaVDsc')}
                onBlur={(e) => handleBlur('magnaVDsc', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.F.F.B.</span>
              <input
                type="text"
                {...register('magnaIffb')}
                value={getDisplayValue('magnaIffb', watch('magnaIffb'))}
                onChange={(e) => handleInputChange('magnaIffb', e.target.value)}
                onFocus={() => handleFocus('magnaIffb')}
                onBlur={(e) => handleBlur('magnaIffb', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
          </div>
        </div>
        )}

        {/* Diesel */}
        {(!estacionSeleccionada || estacionSeleccionada.tieneDiesel !== false) && (
          <div className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-6 bg-gray-50/30 dark:bg-gray-900/20">
            <h3 className="text-lg font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-700 dark:text-gray-300">local_gas_station</span>
              Diesel
            </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  attach_money
                </span>
                <input
                  type="text"
                  {...register('dieselPrecio', {
                    required: estacionSeleccionada?.tieneDiesel !== false ? 'El precio es requerido' : false,
                    min: { value: 0, message: 'El precio debe ser mayor a 0' },
                  })}
                  value={getDisplayValue('dieselPrecio', dieselPrecioValue)}
                  onChange={(e) => handleInputChange('dieselPrecio', e.target.value)}
                  onFocus={() => handleFocus('dieselPrecio')}
                  onBlur={(e) => handleBlur('dieselPrecio', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.dieselPrecio && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dieselPrecio.message}</p>
              )}
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Litros vendidos *</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  water_drop
                </span>
                <input
                  type="text"
                  {...register('dieselLitros', {
                    required: estacionSeleccionada?.tieneDiesel !== false ? 'Los litros son requeridos' : false,
                    min: { value: 0, message: 'Los litros deben ser mayor a 0' },
                  })}
                  value={getDisplayValue('dieselLitros', dieselLitrosValue)}
                  onChange={(e) => handleInputChange('dieselLitros', e.target.value)}
                  onFocus={() => handleFocus('dieselLitros')}
                  onBlur={(e) => handleBlur('dieselLitros', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-12 pl-10 pr-4 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.dieselLitros && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.dieselLitros.message}</p>
              )}
            </label>
          </div>
          {/* Nuevos campos para Diesel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
            {new Date(watch('fecha') || new Date().toISOString().split('T')[0]).getDate() === 1 && (
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.I.B. (Solo día 1)</span>
                <input
                  type="text"
                  {...register('dieselIib')}
                  value={getDisplayValue('dieselIib', watch('dieselIib'))}
                  onChange={(e) => handleInputChange('dieselIib', e.target.value)}
                  onFocus={() => handleFocus('dieselIib')}
                  onBlur={(e) => handleBlur('dieselIib', e.target.value)}
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                  placeholder="0.00"
                />
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Compras (C)</span>
              <input
                type="text"
                {...register('dieselCompras')}
                value={getDisplayValue('dieselCompras', watch('dieselCompras'))}
                onChange={(e) => handleInputChange('dieselCompras', e.target.value)}
                onFocus={() => handleFocus('dieselCompras')}
                onBlur={(e) => handleBlur('dieselCompras', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">CCT</span>
              <input
                type="text"
                {...register('dieselCct')}
                value={getDisplayValue('dieselCct', watch('dieselCct'))}
                onChange={(e) => handleInputChange('dieselCct', e.target.value)}
                onFocus={() => handleFocus('dieselCct')}
                onBlur={(e) => handleBlur('dieselCct', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">V. Dsc</span>
              <input
                type="text"
                {...register('dieselVDsc')}
                value={getDisplayValue('dieselVDsc', watch('dieselVDsc'))}
                onChange={(e) => handleInputChange('dieselVDsc', e.target.value)}
                onFocus={() => handleFocus('dieselVDsc')}
                onBlur={(e) => handleBlur('dieselVDsc', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">I.F.F.B.</span>
              <input
                type="text"
                {...register('dieselIffb')}
                value={getDisplayValue('dieselIffb', watch('dieselIffb'))}
                onChange={(e) => handleInputChange('dieselIffb', e.target.value)}
                onFocus={() => handleFocus('dieselIffb')}
                onBlur={(e) => handleBlur('dieselIffb', e.target.value)}
                className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#101922] text-[#111418] dark:text-white h-10 px-3 focus:ring-2 focus:ring-[#1173d4] focus:border-transparent"
                placeholder="0.00"
              />
            </label>
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto flex-1 bg-[#1173d4] hover:bg-blue-600 text-white font-bold h-12 px-8 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">sync</span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">send</span>
                <span>Enviar Reporte</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 h-12 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-slate-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
