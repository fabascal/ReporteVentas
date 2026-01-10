import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { reportesService } from '../services/reportesService'
import { ReporteVentas } from '../types/reportes'

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

interface FormularioEditarReporteProps {
  reporte: ReporteVentas
  onSuccess: () => void
  onCancel: () => void
}

export default function FormularioEditarReporte({ reporte, onSuccess, onCancel }: FormularioEditarReporteProps) {
  const [estaciones, setEstaciones] = useState<Array<{ id: string; nombre: string; zonaNombre?: string; tienePremium?: boolean; tieneMagna?: boolean; tieneDiesel?: boolean; identificadorExterno?: string }>>([])
  const [estacionSeleccionada, setEstacionSeleccionada] = useState<{ tienePremium?: boolean; tieneMagna?: boolean; tieneDiesel?: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAPI, setIsLoadingAPI] = useState(false)
  const [error, setError] = useState('')
  const [forceUpdate, setForceUpdate] = useState(0)
  const [mermaData, setMermaData] = useState<{
    premium?: { mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    magna?: { mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
    diesel?: { mermaVolumen: number; mermaImporte: number; mermaPorcentaje: number }
  }>({
    premium: {
      mermaVolumen: reporte.premium.mermaVolumen || 0,
      mermaImporte: reporte.premium.mermaImporte || 0,
      mermaPorcentaje: reporte.premium.mermaPorcentaje || 0,
    },
    magna: {
      mermaVolumen: reporte.magna.mermaVolumen || 0,
      mermaImporte: reporte.magna.mermaImporte || 0,
      mermaPorcentaje: reporte.magna.mermaPorcentaje || 0,
    },
    diesel: {
      mermaVolumen: reporte.diesel.mermaVolumen || 0,
      mermaImporte: reporte.diesel.mermaImporte || 0,
      mermaPorcentaje: reporte.diesel.mermaPorcentaje || 0,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      estacionId: reporte.estacionId,
      fecha: reporte.fecha.split('T')[0],
      aceites: reporte.aceites, // Campo único a nivel de reporte
      premiumPrecio: reporte.premium.precio,
      premiumLitros: reporte.premium.litros,
      premiumIib: reporte.premium.iib,
      premiumCompras: reporte.premium.compras,
      premiumCct: reporte.premium.cct,
      premiumVDsc: reporte.premium.vDsc,
      premiumIffb: reporte.premium.iffb,
      magnaPrecio: reporte.magna.precio,
      magnaLitros: reporte.magna.litros,
      magnaIib: reporte.magna.iib,
      magnaCompras: reporte.magna.compras,
      magnaCct: reporte.magna.cct,
      magnaVDsc: reporte.magna.vDsc,
      magnaIffb: reporte.magna.iffb,
      dieselPrecio: reporte.diesel.precio,
      dieselLitros: reporte.diesel.litros,
      dieselIib: reporte.diesel.iib,
      dieselCompras: reporte.diesel.compras,
      dieselCct: reporte.diesel.cct,
      dieselVDsc: reporte.diesel.vDsc,
      dieselIffb: reporte.diesel.iffb,
    },
  })

  // Asegurar que estacionId siempre tenga el valor correcto
  useEffect(() => {
    setValue('estacionId', reporte.estacionId)
  }, [reporte.estacionId, setValue])

  useEffect(() => {
    loadEstaciones()
  }, [])

  useEffect(() => {
    // Establecer la estación seleccionada cuando se carguen las estaciones
    if (estaciones.length > 0) {
      const estacion = estaciones.find(est => est.id === reporte.estacionId)
      if (estacion) {
        setEstacionSeleccionada(estacion)
      }
    }
  }, [estaciones, reporte.estacionId])

  const loadEstaciones = async () => {
    try {
      const data = await reportesService.getEstaciones()
      setEstaciones(data)
    } catch (error) {
      console.error('Error al cargar estaciones:', error)
    }
  }

  const handleObtenerDatosAPI = async () => {
    setIsLoadingAPI(true)
    setError('')

    try {
      // Asegurar que la fecha esté en formato YYYY-MM-DD
      const fechaFormateada = reporte.fecha.includes('T') 
        ? reporte.fecha.split('T')[0] 
        : reporte.fecha.split(' ')[0]
      
      const datos = await reportesService.obtenerDatosAPI(reporte.estacionId, fechaFormateada)

      console.log('Datos obtenidos de la API:', datos)

      // Verificar si se obtuvieron datos
      if (!datos.premium && !datos.magna && !datos.diesel) {
        setError('No se encontraron datos en la API para esta estación y fecha')
        return
      }

      // Limpiar todos los valores temporales y campos enfocados para forzar actualización visual
      setTempValues({})
      setFocusedFields(new Set())

      // Actualizar campos Premium
      if (datos.premium) {
        console.log('Actualizando Premium:', datos.premium)
        console.log('Valores antes de setValue - PremiumPrecio:', watch('premiumPrecio'), 'PremiumLitros:', watch('premiumLitros'))
        setValue('premiumPrecio', datos.premium.precio, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        setValue('premiumLitros', datos.premium.litros, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        console.log('Valores después de setValue - PremiumPrecio:', watch('premiumPrecio'), 'PremiumLitros:', watch('premiumLitros'))
        setMermaData((prev) => ({
          ...prev,
          premium: {
            mermaVolumen: datos.premium!.mermaVolumen,
            mermaImporte: datos.premium!.mermaImporte,
            mermaPorcentaje: datos.premium!.mermaPorcentaje,
          },
        }))
      }

      // Actualizar campos Magna
      if (datos.magna) {
        console.log('Actualizando Magna:', datos.magna)
        setValue('magnaPrecio', datos.magna.precio, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        setValue('magnaLitros', datos.magna.litros, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        setMermaData((prev) => ({
          ...prev,
          magna: {
            mermaVolumen: datos.magna!.mermaVolumen,
            mermaImporte: datos.magna!.mermaImporte,
            mermaPorcentaje: datos.magna!.mermaPorcentaje,
          },
        }))
      }

      // Actualizar campos Diesel
      if (datos.diesel) {
        console.log('Actualizando Diesel:', datos.diesel)
        setValue('dieselPrecio', datos.diesel.precio, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        setValue('dieselLitros', datos.diesel.litros, { shouldValidate: false, shouldDirty: true, shouldTouch: true })
        setMermaData((prev) => ({
          ...prev,
          diesel: {
            mermaVolumen: datos.diesel!.mermaVolumen,
            mermaImporte: datos.diesel!.mermaImporte,
            mermaPorcentaje: datos.diesel!.mermaPorcentaje,
          },
        }))
      }

      // Forzar actualización visual
      setForceUpdate((prev) => prev + 1)

      // Forzar actualización visual después de un pequeño delay
      setTimeout(() => {
        console.log('Valores después del timeout - PremiumPrecio:', watch('premiumPrecio'), 'PremiumLitros:', watch('premiumLitros'))
        // Trigger para forzar actualización visual de los campos
        if (datos.premium) {
          trigger('premiumPrecio')
          trigger('premiumLitros')
        }
        if (datos.magna) {
          trigger('magnaPrecio')
          trigger('magnaLitros')
        }
        if (datos.diesel) {
          trigger('dieselPrecio')
          trigger('dieselLitros')
        }
        // Forzar otro re-render
        setForceUpdate((prev) => prev + 1)
      }, 100)

      // Mostrar mensaje de éxito
      const productosActualizados = [
        datos.premium && 'Premium',
        datos.magna && 'Magna',
        datos.diesel && 'Diesel',
      ].filter(Boolean).join(', ')
      
      if (productosActualizados) {
        // Limpiar el error si había uno previo
        setError('')
        console.log(`Datos actualizados correctamente para: ${productosActualizados}`)
        
        // Guardar automáticamente después de un pequeño delay para asegurar que los valores se hayan actualizado
        setTimeout(async () => {
          try {
            setIsLoading(true)
            setError('')
            
            // Obtener los valores actuales del formulario
            const formData = watch()
            
            // Calcular importes
            const premiumImporte = parseFloat(formData.premiumPrecio?.toString() || '0') * parseFloat(formData.premiumLitros?.toString() || '0')
            const magnaImporte = parseFloat(formData.magnaPrecio?.toString() || '0') * parseFloat(formData.magnaLitros?.toString() || '0')
            const dieselImporte = parseFloat(formData.dieselPrecio?.toString() || '0') * parseFloat(formData.dieselLitros?.toString() || '0')

            // Preparar datos para actualizar
            const updateData = {
              estacionId: formData.estacionId,
              fecha: formData.fecha,
              aceites: formData.aceites ? parseFloat(formData.aceites.toString()) : undefined,
              premium: {
                precio: parseFloat(formData.premiumPrecio.toString()),
                litros: parseFloat(formData.premiumLitros.toString()),
                importe: premiumImporte,
                mermaVolumen: mermaData.premium?.mermaVolumen || 0,
                mermaImporte: mermaData.premium?.mermaImporte || 0,
                mermaPorcentaje: mermaData.premium?.mermaPorcentaje || 0,
                iib: formData.premiumIib ? parseFloat(formData.premiumIib.toString()) : undefined,
                compras: formData.premiumCompras ? parseFloat(formData.premiumCompras.toString()) : undefined,
                cct: formData.premiumCct ? parseFloat(formData.premiumCct.toString()) : undefined,
                vDsc: formData.premiumVDsc ? parseFloat(formData.premiumVDsc.toString()) : undefined,
                iffb: formData.premiumIffb ? parseFloat(formData.premiumIffb.toString()) : undefined,
              },
              magna: {
                precio: parseFloat(formData.magnaPrecio.toString()),
                litros: parseFloat(formData.magnaLitros.toString()),
                importe: magnaImporte,
                mermaVolumen: mermaData.magna?.mermaVolumen || 0,
                mermaImporte: mermaData.magna?.mermaImporte || 0,
                mermaPorcentaje: mermaData.magna?.mermaPorcentaje || 0,
                iib: formData.magnaIib ? parseFloat(formData.magnaIib.toString()) : undefined,
                compras: formData.magnaCompras ? parseFloat(formData.magnaCompras.toString()) : undefined,
                cct: formData.magnaCct ? parseFloat(formData.magnaCct.toString()) : undefined,
                vDsc: formData.magnaVDsc ? parseFloat(formData.magnaVDsc.toString()) : undefined,
                iffb: formData.magnaIffb ? parseFloat(formData.magnaIffb.toString()) : undefined,
              },
              diesel: {
                precio: parseFloat(formData.dieselPrecio.toString()),
                litros: parseFloat(formData.dieselLitros.toString()),
                importe: dieselImporte,
                mermaVolumen: mermaData.diesel?.mermaVolumen || 0,
                mermaImporte: mermaData.diesel?.mermaImporte || 0,
                mermaPorcentaje: mermaData.diesel?.mermaPorcentaje || 0,
                iib: formData.dieselIib ? parseFloat(formData.dieselIib.toString()) : undefined,
                compras: formData.dieselCompras ? parseFloat(formData.dieselCompras.toString()) : undefined,
                cct: formData.dieselCct ? parseFloat(formData.dieselCct.toString()) : undefined,
                vDsc: formData.dieselVDsc ? parseFloat(formData.dieselVDsc.toString()) : undefined,
                iffb: formData.dieselIffb ? parseFloat(formData.dieselIffb.toString()) : undefined,
              },
            }

            // Guardar automáticamente
            await reportesService.updateReporte(reporte.id, updateData)
            console.log('Reporte guardado automáticamente después de obtener datos de la API')
            
            // Llamar a onSuccess para refrescar los datos
            onSuccess()
          } catch (err: any) {
            console.error('Error al guardar automáticamente:', err)
            setError(err.response?.data?.message || 'Error al guardar los datos automáticamente')
          } finally {
            setIsLoading(false)
          }
        }, 200)
      }
    } catch (err: any) {
      console.error('Error al obtener datos de la API:', err)
      setError(err.response?.data?.message || 'Error al obtener datos de la API externa')
    } finally {
      setIsLoadingAPI(false)
    }
  }

  // Estado para rastrear qué campos están enfocados (sin formato)
  const [focusedFields, setFocusedFields] = useState<Set<string>>(new Set())
  const [tempValues, setTempValues] = useState<Record<string, string>>({})

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
    return value.replace(/,/g, '')
  }

  // Handler para cuando el campo pierde el foco - formatear
  const handleBlur = (fieldName: keyof FormData, value: string) => {
    const fieldKey = fieldName as string

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

    let cleaned = value.replace(/[^0-9.]/g, '')

    const parts = cleaned.split('.')
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('')
    }

    setTempValues((prev) => ({ ...prev, [fieldKey]: cleaned }))

    if (cleaned === '') {
      setValue(fieldName, 0, { shouldValidate: false })
      setTempValues((prev) => {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      })
      return
    }

    if (cleaned === '.' || cleaned.endsWith('.')) {
      setValue(fieldName, 0, { shouldValidate: false })
      return
    }

    const numValue = parseFloat(cleaned) || 0
    setValue(fieldName, numValue, { shouldValidate: false })

    if (!isNaN(numValue) && !cleaned.endsWith('.')) {
      setTempValues((prev) => {
        const next = { ...prev }
        delete next[fieldKey]
        return next
      })
    }
  }

  // Función para obtener el valor a mostrar
  const getDisplayValue = (fieldName: keyof FormData, value: number | undefined): string => {
    const fieldKey = fieldName as string

    if (tempValues[fieldKey] !== undefined) {
      return tempValues[fieldKey]
    }

    // Permitir mostrar 0 explícitamente
    if (value === undefined || value === null) return ''

    if (focusedFields.has(fieldKey)) {
      return value.toString()
    }

    return formatNumber(value)
  }

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError('')

    try {
      // Calcular importe (precio * litros)
      const premiumImporte = parseFloat(data.premiumPrecio.toString()) * parseFloat(data.premiumLitros.toString())
      const magnaImporte = parseFloat(data.magnaPrecio.toString()) * parseFloat(data.magnaLitros.toString())
      const dieselImporte = parseFloat(data.dieselPrecio.toString()) * parseFloat(data.dieselLitros.toString())

      await reportesService.updateReporte(reporte.id, {
        estacionId: data.estacionId,
        fecha: data.fecha,
        aceites: data.aceites ? parseFloat(data.aceites.toString()) : undefined, // Campo único a nivel de reporte
        premium: {
          precio: parseFloat(data.premiumPrecio.toString()),
          litros: parseFloat(data.premiumLitros.toString()),
          importe: premiumImporte,
          mermaVolumen: mermaData.premium?.mermaVolumen || 0,
          mermaImporte: mermaData.premium?.mermaImporte || 0,
          mermaPorcentaje: mermaData.premium?.mermaPorcentaje || 0,
          iib: data.premiumIib ? parseFloat(data.premiumIib.toString()) : undefined,
          compras: data.premiumCompras ? parseFloat(data.premiumCompras.toString()) : undefined,
          cct: data.premiumCct ? parseFloat(data.premiumCct.toString()) : undefined,
          vDsc: data.premiumVDsc ? parseFloat(data.premiumVDsc.toString()) : undefined,
          iffb: data.premiumIffb ? parseFloat(data.premiumIffb.toString()) : undefined,
        },
        magna: {
          precio: parseFloat(data.magnaPrecio.toString()),
          litros: parseFloat(data.magnaLitros.toString()),
          importe: magnaImporte,
          mermaVolumen: mermaData.magna?.mermaVolumen || 0,
          mermaImporte: mermaData.magna?.mermaImporte || 0,
          mermaPorcentaje: mermaData.magna?.mermaPorcentaje || 0,
          iib: data.magnaIib ? parseFloat(data.magnaIib.toString()) : undefined,
          compras: data.magnaCompras ? parseFloat(data.magnaCompras.toString()) : undefined,
          cct: data.magnaCct ? parseFloat(data.magnaCct.toString()) : undefined,
          vDsc: data.magnaVDsc ? parseFloat(data.magnaVDsc.toString()) : undefined,
          iffb: data.magnaIffb ? parseFloat(data.magnaIffb.toString()) : undefined,
        },
        diesel: {
          precio: parseFloat(data.dieselPrecio.toString()),
          litros: parseFloat(data.dieselLitros.toString()),
          importe: dieselImporte,
          mermaVolumen: mermaData.diesel?.mermaVolumen || 0,
          mermaImporte: mermaData.diesel?.mermaImporte || 0,
          mermaPorcentaje: mermaData.diesel?.mermaPorcentaje || 0,
          iib: data.dieselIib ? parseFloat(data.dieselIib.toString()) : undefined,
          compras: data.dieselCompras ? parseFloat(data.dieselCompras.toString()) : undefined,
          cct: data.dieselCct ? parseFloat(data.dieselCct.toString()) : undefined,
          vDsc: data.dieselVDsc ? parseFloat(data.dieselVDsc.toString()) : undefined,
          iffb: data.dieselIffb ? parseFloat(data.dieselIffb.toString()) : undefined,
        },
      })
      onSuccess()
    } catch (err: any) {
      console.error('Error al actualizar reporte:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar el reporte'
      setError(errorMessage)
      console.error('Mensaje de error del servidor:', errorMessage)
      console.error('Status code:', err.response?.status)
      console.error('Response data:', err.response?.data)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm dark:bg-black/50">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-[#e6e8eb] dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#111418] dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1173d4]">edit</span>
            Editar Reporte - {reporte.estacionNombre}
          </h3>
          <button
            onClick={onCancel}
            className="size-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-[#617589] dark:text-slate-400 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
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
          
          {/* Botón para obtener datos de la API */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleObtenerDatosAPI}
              disabled={isLoadingAPI}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingAPI ? (
                <>
                  <span className="material-symbols-outlined animate-spin">sync</span>
                  <span>Obteniendo datos...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">cloud_download</span>
                  <span>Obtener datos de la API</span>
                </>
              )}
            </button>
          </div>

          {/* Row 1: Estación, Fecha & Aceites */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Estación</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  store
                </span>
                <input
                  type="text"
                  value={reporte.estacionNombre}
                  disabled
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-gray-100 dark:bg-[#1a2632] text-[#111418] dark:text-white h-12 pl-10 pr-4 cursor-not-allowed opacity-70"
                />
                {/* Campo oculto para mantener el estacionId en el formulario */}
                <input type="hidden" {...register('estacionId')} value={reporte.estacionId} />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Fecha de Transacción</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                  calendar_month
                </span>
                <input
                  type="text"
                  value={new Date(reporte.fecha).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  disabled
                  className="w-full rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-gray-100 dark:bg-[#1a2632] text-[#111418] dark:text-white h-12 pl-10 pr-4 cursor-not-allowed opacity-70"
                />
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                    attach_money
                  </span>
                  <input
                    type="text"
                    {...register('premiumPrecio', {
                      required: 'El precio es requerido',
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
                      required: 'Los litros son requeridos',
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
            {/* Merma Premium */}
            <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3">Merma</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Volumen Merma (L)</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.premium.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ${reporte.premium.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Porcentaje Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.premium.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </p>
                </div>
              </div>
            </div>
            {/* Nuevos campos para Premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
              {(() => {
                const fechaReporte = new Date(reporte.fecha)
                const esDiaUno = fechaReporte.getDate() === 1
                return esDiaUno && (
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
                )
              })()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                    attach_money
                  </span>
                  <input
                    type="text"
                    {...register('magnaPrecio', {
                      required: 'El precio es requerido',
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
                      required: 'Los litros son requeridos',
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
            {/* Merma Magna */}
            <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3">Merma</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Volumen Merma (L)</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.magna.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ${reporte.magna.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Porcentaje Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.magna.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </p>
                </div>
              </div>
            </div>
            {/* Nuevos campos para Magna */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
              {(() => {
                const fechaReporte = new Date(reporte.fecha)
                const esDiaUno = fechaReporte.getDate() === 1
                return esDiaUno && (
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
                )
              })()}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[#111418] dark:text-gray-200">Precio (MXN) *</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] dark:text-slate-400 pointer-events-none">
                    attach_money
                  </span>
                  <input
                    type="text"
                    {...register('dieselPrecio', {
                      required: 'El precio es requerido',
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
                      required: 'Los litros son requeridos',
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
            {/* Merma Diesel */}
            <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
              <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-3">Merma</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Volumen Merma (L)</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.diesel.mermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Importe Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    ${reporte.diesel.mermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 mb-1">Porcentaje Merma</p>
                  <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                    {reporte.diesel.mermaPorcentaje.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </p>
                </div>
              </div>
            </div>
            {/* Nuevos campos para Diesel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#e6e8eb] dark:border-slate-700">
              {(() => {
                const fechaReporte = new Date(reporte.fecha)
                const esDiaUno = fechaReporte.getDate() === 1
                return esDiaUno && (
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
                )
              })()}
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
                  <span className="material-symbols-outlined">save</span>
                  <span>Guardar Cambios</span>
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
    </div>
  )
}

