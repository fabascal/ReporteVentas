import { ReporteVentas } from '../types/reportes'
import { formatFechaHora, formatFechaSolo } from './dateUtils'

/**
 * Función para exportar un reporte a Excel (CSV) con todos los campos gerenciales
 */
export function exportarReporteExcel(reporte: ReporteVentas) {
  // Calcular totales
  const totalVentas = (reporte.premium.importe || 0) + (reporte.magna.importe || 0) + (reporte.diesel.importe || 0)
  const totalMermaVolumen = (reporte.premium.mermaVolumen || 0) + (reporte.magna.mermaVolumen || 0) + (reporte.diesel.mermaVolumen || 0)
  const totalMermaImporte = (reporte.premium.mermaImporte || 0) + (reporte.magna.mermaImporte || 0) + (reporte.diesel.mermaImporte || 0)
  const totalLitros = (reporte.premium.litros || 0) + (reporte.magna.litros || 0) + (reporte.diesel.litros || 0)
  const volumenNeto = totalLitros - totalMermaVolumen
  const importeNeto = totalVentas - totalMermaImporte

  // Calcular totales de inventario y compras
  const totalIIB = (reporte.premium.iib || 0) + (reporte.magna.iib || 0) + (reporte.diesel.iib || 0)
  const totalCompras = (reporte.premium.compras || 0) + (reporte.magna.compras || 0) + (reporte.diesel.compras || 0)
  const totalCCT = (reporte.premium.cct || 0) + (reporte.magna.cct || 0) + (reporte.diesel.cct || 0)
  const totalVDsc = (reporte.premium.vDsc || 0) + (reporte.magna.vDsc || 0) + (reporte.diesel.vDsc || 0)
  const totalDC = (reporte.premium.dc || 0) + (reporte.magna.dc || 0) + (reporte.diesel.dc || 0)
  const totalDifVDsc = (reporte.premium.difVDsc || 0) + (reporte.magna.difVDsc || 0) + (reporte.diesel.difVDsc || 0)
  const totalIF = (reporte.premium.if || 0) + (reporte.magna.if || 0) + (reporte.diesel.if || 0)
  const totalIFFB = (reporte.premium.iffb || 0) + (reporte.magna.iffb || 0) + (reporte.diesel.iffb || 0)

  const fechaFormatoLegible = new Date(reporte.fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Crear datos para Excel con formato profesional
  const datos = [
    ['REPORTE GERENCIAL DE VENTAS DIARIAS'],
    [''],
    ['INFORMACIÓN GENERAL'],
    ['Estación:', reporte.estacionNombre],
    ['Zona:', reporte.zonaNombre || 'N/A'],
    ['Fecha del Reporte:', fechaFormatoLegible],
    ['ID del Reporte:', reporte.id],
    ['Estado:', reporte.estado],
    [''],
    ['AUDITORÍA'],
    ['Creado por:', reporte.creadoPor || 'N/A'],
    ['Fecha de creación:', reporte.fechaCreacion ? formatFechaHora(reporte.fechaCreacion) : 'N/A'],
    ['Revisado por:', reporte.revisadoPor || 'N/A'],
    ['Fecha de revisión:', reporte.fechaRevision ? formatFechaHora(reporte.fechaRevision) : 'N/A'],
    ...(reporte.comentarios ? [['Comentarios:', reporte.comentarios]] : []),
    [''],
    ['='.repeat(100)],
    ['DETALLE DE VENTAS POR COMBUSTIBLE'],
    ['='.repeat(100)],
    [''],
    // Encabezado de tabla de ventas
    [
      'Combustible',
      'Precio Unitario',
      'Litros Vendidos',
      'Importe Venta',
      'Volumen Merma (L)',
      'Importe Merma',
      'Merma (%)',
      'Volumen Neto (L)',
      'Importe Neto',
    ],
    // Premium
    [
      'Premium',
      `$${(reporte.premium.precio || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.premium.litros || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.premium.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.premium.mermaVolumen || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.premium.mermaImporte || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      `${(reporte.premium.mermaPorcentaje || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`,
      ((reporte.premium.litros || 0) - (reporte.premium.mermaVolumen || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      `$${((reporte.premium.importe || 0) - (reporte.premium.mermaImporte || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })}`,
    ],
    // Magna
    [
      'Magna',
      `$${(reporte.magna.precio || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.magna.litros || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.magna.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.magna.mermaVolumen || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.magna.mermaImporte || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      `${(reporte.magna.mermaPorcentaje || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`,
      ((reporte.magna.litros || 0) - (reporte.magna.mermaVolumen || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      `$${((reporte.magna.importe || 0) - (reporte.magna.mermaImporte || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })}`,
    ],
    // Diesel
    [
      'Diesel',
      `$${(reporte.diesel.precio || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.diesel.litros || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.diesel.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      (reporte.diesel.mermaVolumen || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${(reporte.diesel.mermaImporte || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      `${(reporte.diesel.mermaPorcentaje || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}%`,
      ((reporte.diesel.litros || 0) - (reporte.diesel.mermaVolumen || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      `$${((reporte.diesel.importe || 0) - (reporte.diesel.mermaImporte || 0)).toLocaleString('es-MX', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      })}`,
    ],
    // Totales de ventas
    [
      'TOTALES VENTAS',
      '',
      totalLitros.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      totalMermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${totalMermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      totalMermaVolumen > 0
        ? `${((totalMermaVolumen / totalLitros) * 100).toLocaleString('es-MX', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}%`
        : '0.00%',
      volumenNeto.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      `$${importeNeto.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
    ],
    [''],
    ['='.repeat(100)],
    ['INVENTARIO Y COMPRAS'],
    ['='.repeat(100)],
    [''],
    // Encabezado de inventario
    ['Combustible', 'I.I.B.', 'Compras (C)', 'CCT', 'V. Dsc', 'DC', 'Dif V. Dsc', 'I.F.', 'I.F.F.B.'],
    // Premium
    [
      'Premium',
      (reporte.premium.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.premium.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    ],
    // Magna
    [
      'Magna',
      (reporte.magna.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.magna.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    ],
    // Diesel
    [
      'Diesel',
      (reporte.diesel.iib || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.compras || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.cct || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.vDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.dc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.difVDsc || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.if || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      (reporte.diesel.iffb || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    ],
    // Totales de inventario
    [
      'TOTALES',
      totalIIB.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalCompras.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalCCT.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalVDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalDC.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalDifVDsc.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalIF.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
      totalIFFB.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    ],
    [''],
    ['='.repeat(100)],
    ['RESUMEN EJECUTIVO'],
    ['='.repeat(100)],
    [''],
    ['Concepto', 'Valor'],
    ['Total de Ventas (Combustibles)', `$${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`],
    ['Aceites y Lubricantes', `$${(reporte.aceites || 0).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`],
    [
      'TOTAL GENERAL DE VENTAS',
      `$${(totalVentas + (reporte.aceites || 0)).toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
    ],
    [''],
    ['Total Litros Vendidos', `${totalLitros.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L`],
    ['Total Merma Volumen', `${totalMermaVolumen.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L`],
    ['Volumen Neto', `${volumenNeto.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} L`],
    ['Total Merma Importe', `$${totalMermaImporte.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`],
    ['Importe Neto', `$${importeNeto.toLocaleString('es-MX', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`],
    [''],
    ['Fecha de Generación del Reporte:', new Date().toLocaleString('es-MX')],
  ]

  // Convertir a CSV (compatible con Excel)
  const csv = datos.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  const fechaFormato = new Date(reporte.fecha).toISOString().split('T')[0]
  const nombreArchivo = `Reporte_Gerencial_${reporte.estacionNombre.replace(/\s+/g, '_')}_${fechaFormato}.csv`
  link.setAttribute('href', url)
  link.setAttribute('download', nombreArchivo)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
