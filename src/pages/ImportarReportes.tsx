import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { sileo } from 'sileo'
import importExcelService, { ResultadoImportacion } from '../services/importExcelService'

export default function ImportarReportes() {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const importMutation = useMutation({
    mutationFn: (file: File) => importExcelService.importarReportesExcel(file),
    onSuccess: (data) => {
      setResultado(data)
      if (data.exitosos > 0) {
        sileo.success({ title: data.message })
      } else {
        sileo.error({ title: 'No se pudo importar ningún registro' })
      }
    },
    onError: (error: any) => {
      sileo.error({ title: error.response?.data?.message || 'Error al importar archivo' })
      console.error('Error:', error)
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea un archivo Excel
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setArchivo(file)
        setResultado(null)
      } else {
        sileo.error({ title: 'Solo se permiten archivos Excel (.xlsx, .xls)' })
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setArchivo(file)
        setResultado(null)
      } else {
        sileo.error({ title: 'Solo se permiten archivos Excel (.xlsx, .xls)' })
      }
    }
  }

  const handleImportar = () => {
    if (!archivo) {
      sileo.error({ title: 'Selecciona un archivo primero' })
      return
    }
    importMutation.mutate(archivo)
  }

  const handleLimpiar = () => {
    setArchivo(null)
    setResultado(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
          Importar Reportes desde Excel
        </h1>
        <p className="text-[#617589] dark:text-slate-400 mt-2">
          Carga un archivo Excel con datos de reportes para múltiples estaciones
        </p>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex items-start">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3">
            info
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Formato del archivo Excel:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>Cada <strong>hoja</strong> debe nombrarse con el <strong>identificador externo</strong> de la estación (ej: "11091" para Autlan)</li>
              <li>Columnas requeridas: <strong>Fecha, Producto, IIB, C, CCT, V.DSC, IFFB</strong></li>
              <li>El producto puede ser: "Premium", "Magna", "Diesel" o "1", "2", "3"</li>
              <li>Solo se actualizarán reportes que ya existan en el sistema</li>
              <li>Si es el día 1 del mes, se actualizará el IIB</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Área de carga de archivo */}
      <div className="bg-white dark:bg-[#1a2632] rounded-lg shadow-sm border border-[#e6e8eb] dark:border-slate-700 p-6 mb-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        >
          <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500 mb-4">
            upload_file
          </span>
          
          {archivo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <span className="material-symbols-outlined">check_circle</span>
                <span className="font-semibold">{archivo.name}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(archivo.size / 1024).toFixed(2)} KB
              </p>
              <button
                onClick={handleLimpiar}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 underline"
              >
                Cambiar archivo
              </button>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold text-[#111418] dark:text-white mb-2">
                Arrastra tu archivo Excel aquí
              </p>
              <p className="text-sm text-[#617589] dark:text-slate-400 mb-4">
                o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined mr-2">folder_open</span>
                Seleccionar archivo
              </label>
            </>
          )}
        </div>

        {/* Botón de importar */}
        {archivo && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleLimpiar}
              disabled={importMutation.isPending}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleImportar}
              disabled={importMutation.isPending}
              className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importMutation.isPending ? (
                <>
                  <span className="animate-spin material-symbols-outlined mr-2">
                    progress_activity
                  </span>
                  Importando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined mr-2">cloud_upload</span>
                  Importar datos
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Resultados */}
      {resultado && (
        <div className="bg-white dark:bg-[#1a2632] rounded-lg shadow-sm border border-[#e6e8eb] dark:border-slate-700 p-6">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">
              {resultado.exitosos > 0 ? 'check_circle' : 'error'}
            </span>
            Resultados de la Importación
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400 mb-1">Exitosos</div>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                {resultado.exitosos}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400 mb-1">Errores</div>
              <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                {resultado.errores}
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {resultado.detalles.map((detalle, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  detalle.error
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`material-symbols-outlined text-sm ${
                    detalle.error ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {detalle.error ? 'error' : 'check_circle'}
                  </span>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold text-[#111418] dark:text-white">
                      Hoja: {detalle.hoja}
                      {detalle.estacion && ` - ${detalle.estacion}`}
                      {detalle.fecha && ` - ${detalle.fecha}`}
                    </div>
                    {detalle.error ? (
                      <div className="text-red-600 dark:text-red-400 mt-1">
                        {detalle.error}
                      </div>
                    ) : (
                      <div className="text-green-600 dark:text-green-400 mt-1">
                        {detalle.mensaje} 
                        {detalle.productos && ` (${detalle.productos} productos)`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
