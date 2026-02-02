import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { reportesService } from '../services/reportesService'
import { useAuth } from '../contexts/AuthContext'
import { Role } from '../types/auth'
import GerenteEstacionHeader from '../components/GerenteEstacionHeader'
import GerenteZonaHeader from '../components/GerenteZonaHeader'
import FormularioEditarReporte from '../components/FormularioEditarReporte'

export default function CorreccionReporte() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: reporte, isLoading } = useQuery({
    queryKey: ['reporte', id],
    queryFn: () => reportesService.getReporteById(id!),
    enabled: !!id,
  })

  const renderHeader = () => {
    if (user?.role === Role.GerenteZona) {
      return <GerenteZonaHeader vistaActiva="revision" onChangeVista={() => {}} />
    }
    return <GerenteEstacionHeader vistaActiva="reportes" onChangeVista={() => {}} />
  }

  if (isLoading) return <div>Cargando...</div>
  if (!reporte) return <div>Reporte no encontrado</div>

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      {renderHeader()}
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#111418] dark:text-white">
            Corrección de Reporte
          </h1>
        </div>
        
        <FormularioEditarReporte
          reporte={reporte}
          onSuccess={() => navigate(-1)}
          onCancel={() => navigate(-1)}
        />
      </main>
    </div>
  )
}
