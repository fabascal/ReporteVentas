import api from '../config/axios'

export interface ResultadoImportacion {
  success: boolean
  message: string
  exitosos: number
  errores: number
  detalles: Array<{
    hoja: string
    estacion?: string
    fecha?: string
    productos?: number
    mensaje?: string
    error?: string
    tipo?: string
  }>
}

const importExcelService = {
  async importarReportesExcel(archivo: File): Promise<ResultadoImportacion> {
    const formData = new FormData()
    formData.append('archivo', archivo)

    const response = await api.post<ResultadoImportacion>(
      '/import-excel/importar',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000 // 1 minuto de timeout para archivos grandes
      }
    )

    return response.data
  }
}

export default importExcelService
