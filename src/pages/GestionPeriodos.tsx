import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ejerciciosService, { EjercicioFiscal, PeriodoMensual, ZonaDetalle } from '../services/ejerciciosService';
import DynamicHeader from '../components/DynamicHeader';
import toast from 'react-hot-toast';

export default function GestionPeriodos() {
  const queryClient = useQueryClient();
  const [expandedEjercicio, setExpandedEjercicio] = useState<number | null>(null);
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    anio: new Date().getFullYear() + 1,
    nombre: '',
    descripcion: ''
  });
  const [showModalObservaciones, setShowModalObservaciones] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<{
    zona_id: string;
    zona_nombre: string;
    anio: number;
    mes: number;
    tipo: 'operativo' | 'contable';
    accion: 'cerrar' | 'reabrir';
  } | null>(null);
  const [observaciones, setObservaciones] = useState('');

  // Obtener todos los ejercicios
  const { data: ejercicios, isLoading } = useQuery({
    queryKey: ['ejercicios'],
    queryFn: () => ejerciciosService.getAll(),
  });

  // Obtener periodos mensuales del ejercicio expandido
  const { data: periodos } = useQuery({
    queryKey: ['periodos', expandedEjercicio],
    queryFn: () => ejerciciosService.getPeriodos(expandedEjercicio!),
    enabled: expandedEjercicio !== null,
  });

  // Crear nuevo ejercicio
  const createMutation = useMutation({
    mutationFn: (data: { anio: number; nombre: string; descripcion?: string }) =>
      ejerciciosService.create(data),
    onSuccess: () => {
      toast.success('Ejercicio fiscal creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      queryClient.invalidateQueries({ queryKey: ['ejercicios-activos'] });
      setShowModalNuevo(false);
      setNuevoEjercicio({
        anio: new Date().getFullYear() + 1,
        nombre: '',
        descripcion: ''
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al crear ejercicio');
    },
  });

  // Actualizar estado
  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'activo' | 'inactivo' | 'cerrado' }) =>
      ejerciciosService.updateEstado(id, estado),
    onSuccess: (_, variables) => {
      const estadoLabels = {
        activo: 'activado',
        inactivo: 'desactivado',
        cerrado: 'cerrado'
      };
      toast.success(`Ejercicio ${estadoLabels[variables.estado]} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['ejercicios'] });
      queryClient.invalidateQueries({ queryKey: ['ejercicios-activos'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al actualizar ejercicio');
    },
  });

  // Cerrar/reabrir periodo operativo
  const togglePeriodoOperativoMutation = useMutation({
    mutationFn: ({ zona_id, anio, mes, accion }: { zona_id: string; anio: number; mes: number; accion: 'cerrar' | 'reabrir' }) =>
      accion === 'cerrar' 
        ? ejerciciosService.cerrarPeriodoOperativo(zona_id, anio, mes)
        : ejerciciosService.reabrirPeriodoOperativo(zona_id, anio, mes),
    onSuccess: (_, variables) => {
      toast.success(`Periodo operativo ${variables.accion === 'cerrar' ? 'cerrado' : 'reabierto'} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['periodos', expandedEjercicio] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al modificar periodo operativo');
    },
  });

  // Cerrar/reabrir periodo contable
  const togglePeriodoContableMutation = useMutation({
    mutationFn: ({ zona_id, anio, mes, accion, observaciones }: { zona_id: string; anio: number; mes: number; accion: 'cerrar' | 'reabrir'; observaciones?: string }) =>
      accion === 'cerrar' 
        ? ejerciciosService.cerrarPeriodoContable(zona_id, anio, mes, observaciones)
        : ejerciciosService.reabrirPeriodoContable(zona_id, anio, mes),
    onSuccess: (_, variables) => {
      toast.success(`Periodo contable ${variables.accion === 'cerrar' ? 'cerrado' : 'reabierto'} exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['periodos', expandedEjercicio] });
      setShowModalObservaciones(false);
      setPeriodoSeleccionado(null);
      setObservaciones('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al modificar periodo contable');
    },
  });

  const handleToggleExpand = (anio: number) => {
    setExpandedEjercicio(expandedEjercicio === anio ? null : anio);
  };

  const handleCreateEjercicio = () => {
    if (!nuevoEjercicio.anio || !nuevoEjercicio.nombre) {
      toast.error('Año y nombre son requeridos');
      return;
    }
    createMutation.mutate(nuevoEjercicio);
  };

  const handleTogglePeriodo = (zona: ZonaDetalle, mes: number, anio: number, tipo: 'operativo' | 'contable', accion: 'cerrar' | 'reabrir') => {
    if (tipo === 'contable' && accion === 'cerrar') {
      // Para cerrar contable, mostrar modal de observaciones
      setPeriodoSeleccionado({
        zona_id: zona.zona_id,
        zona_nombre: zona.zona_nombre,
        anio,
        mes,
        tipo,
        accion
      });
      setShowModalObservaciones(true);
    } else if (tipo === 'operativo') {
      // Para operativo, ejecutar directamente
      togglePeriodoOperativoMutation.mutate({ zona_id: zona.zona_id, anio, mes, accion });
    } else {
      // Para reabrir contable, ejecutar directamente
      togglePeriodoContableMutation.mutate({ zona_id: zona.zona_id, anio, mes, accion });
    }
  };

  const handleConfirmarCierreContable = () => {
    if (periodoSeleccionado) {
      togglePeriodoContableMutation.mutate({
        zona_id: periodoSeleccionado.zona_id,
        anio: periodoSeleccionado.anio,
        mes: periodoSeleccionado.mes,
        accion: 'cerrar',
        observaciones
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges = {
      activo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      inactivo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      cerrado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return badges[estado as keyof typeof badges] || badges.inactivo;
  };

  const getMesNombre = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
        <DynamicHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />
      
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-2">
              Gestión de Períodos Fiscales
            </h1>
            <p className="text-[#60758a] dark:text-gray-400">
              Administra los ejercicios fiscales y controla qué años están activos en el sistema
            </p>
          </div>
          
          <button
            onClick={() => setShowModalNuevo(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Nuevo Ejercicio
          </button>
        </div>

        {/* Info Card */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">info</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                ¿Qué son los ejercicios fiscales?
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                Los ejercicios fiscales controlan qué años están disponibles en los filtros de fecha del sistema. 
                Solo los ejercicios <strong>activos</strong> aparecerán como opciones para los usuarios. 
                Los ejercicios <strong>inactivos</strong> están ocultos pero los datos históricos se conservan.
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Ejercicios */}
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e6e8eb] dark:border-slate-700">
            <h2 className="text-xl font-bold text-[#111418] dark:text-white">
              Ejercicios Fiscales
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f6f7f8] dark:bg-[#0d1b2a]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                    Progreso Cierre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#617589] dark:text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
                {ejercicios?.map((ejercicio: EjercicioFiscal) => (
                  <>
                    <tr key={ejercicio.id} className="hover:bg-[#f6f7f8] dark:hover:bg-[#0d1b2a] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleExpand(ejercicio.anio)}
                            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
                          >
                            <span className="material-symbols-outlined text-xl">
                              {expandedEjercicio === ejercicio.anio ? 'expand_less' : 'expand_more'}
                            </span>
                          </button>
                          <span className="text-lg font-bold text-[#111418] dark:text-white">
                            {ejercicio.anio}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#111418] dark:text-white">
                          {ejercicio.nombre}
                        </div>
                        {ejercicio.descripcion && (
                          <div className="text-xs text-[#617589] dark:text-slate-400 mt-1">
                            {ejercicio.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(ejercicio.estado)}`}>
                          {ejercicio.estado.charAt(0).toUpperCase() + ejercicio.estado.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[#617589] dark:text-slate-400">Operativo:</span>
                            <span className="font-semibold text-[#111418] dark:text-white">
                              {ejercicio.meses_cerrados_operativo || 0}/12
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${((ejercicio.meses_cerrados_operativo || 0) / 12) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[#617589] dark:text-slate-400">Contable:</span>
                            <span className="font-semibold text-[#111418] dark:text-white">
                              {ejercicio.meses_cerrados_contable || 0}/12
                            </span>
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-[100px]">
                              <div
                                className="bg-green-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${((ejercicio.meses_cerrados_contable || 0) / 12) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {ejercicio.estado === 'activo' && (
                            <button
                              onClick={() => updateEstadoMutation.mutate({ id: ejercicio.id, estado: 'inactivo' })}
                              className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                              title="Desactivar"
                            >
                              <span className="material-symbols-outlined">visibility_off</span>
                            </button>
                          )}
                          {ejercicio.estado === 'inactivo' && (
                            <button
                              onClick={() => updateEstadoMutation.mutate({ id: ejercicio.id, estado: 'activo' })}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              title="Activar"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandida con periodos mensuales */}
                    {expandedEjercicio === ejercicio.anio && periodos && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-[#f6f7f8] dark:bg-[#0d1b2a]">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {periodos.map((periodo: PeriodoMensual) => (
                              <div
                                key={periodo.mes}
                                className="bg-white dark:bg-[#1a2632] border border-[#e6e8eb] dark:border-slate-700 rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-bold text-[#111418] dark:text-white">
                                    {getMesNombre(periodo.mes)}
                                  </h4>
                                  <span className="text-xs text-[#617589] dark:text-slate-400">
                                    {periodo.mes}/{ejercicio.anio}
                                  </span>
                                </div>

                                <div className="space-y-3 text-sm">
                                  {/* Detalle por zona */}
                                  {periodo.zonas_detalle && periodo.zonas_detalle.length > 0 ? (
                                    <div className="space-y-2">
                                      {periodo.zonas_detalle.map((zona: ZonaDetalle) => (
                                        <div key={zona.zona_id} className="border border-[#e6e8eb] dark:border-slate-600 rounded-lg p-3 bg-gray-50 dark:bg-[#0d1b2a]">
                                          <div className="font-bold text-sm text-[#111418] dark:text-white mb-2">
                                            {zona.zona_nombre}
                                          </div>
                                          <div className="grid grid-cols-2 gap-2">
                                            {/* Cierre Operativo */}
                                            <div className="flex flex-col gap-1">
                                              <span className="text-[10px] text-[#617589] dark:text-slate-400 uppercase font-semibold">
                                                Operativo
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold flex-1 ${
                                                  zona.operativo_cerrado 
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                  <span className="material-symbols-outlined text-sm">
                                                    {zona.operativo_cerrado ? 'lock' : 'lock_open'}
                                                  </span>
                                                  {zona.operativo_cerrado ? 'Cerrado' : 'Abierto'}
                                                </span>
                                                <button
                                                  onClick={() => handleTogglePeriodo(zona, periodo.mes, ejercicio.anio, 'operativo', zona.operativo_cerrado ? 'reabrir' : 'cerrar')}
                                                  disabled={togglePeriodoOperativoMutation.isPending}
                                                  className={`p-1 rounded transition-colors ${
                                                    zona.operativo_cerrado
                                                      ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-600'
                                                      : 'hover:bg-blue-100 dark:hover:bg-blue-900/20 text-blue-600'
                                                  }`}
                                                  title={zona.operativo_cerrado ? 'Reabrir' : 'Cerrar'}
                                                >
                                                  <span className="material-symbols-outlined text-base">
                                                    {zona.operativo_cerrado ? 'lock_open' : 'lock'}
                                                  </span>
                                                </button>
                                              </div>
                                            </div>
                                            {/* Cierre Contable */}
                                            <div className="flex flex-col gap-1">
                                              <span className="text-[10px] text-[#617589] dark:text-slate-400 uppercase font-semibold">
                                                Contable
                                              </span>
                                              <div className="flex items-center gap-1">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold flex-1 ${
                                                  zona.contable_cerrado 
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                }`}>
                                                  <span className="material-symbols-outlined text-sm">
                                                    {zona.contable_cerrado ? 'verified' : 'pending'}
                                                  </span>
                                                  {zona.contable_cerrado ? 'Cerrado' : 'Abierto'}
                                                </span>
                                                <button
                                                  onClick={() => handleTogglePeriodo(zona, periodo.mes, ejercicio.anio, 'contable', zona.contable_cerrado ? 'reabrir' : 'cerrar')}
                                                  disabled={togglePeriodoContableMutation.isPending}
                                                  className={`p-1 rounded transition-colors ${
                                                    zona.contable_cerrado
                                                      ? 'hover:bg-yellow-100 dark:hover:bg-yellow-900/20 text-yellow-600'
                                                      : 'hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600'
                                                  }`}
                                                  title={zona.contable_cerrado ? 'Reabrir' : 'Cerrar'}
                                                >
                                                  <span className="material-symbols-outlined text-base">
                                                    {zona.contable_cerrado ? 'lock_open' : 'verified'}
                                                  </span>
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-xs text-[#617589] dark:text-slate-400 text-center py-2">
                                      Sin información de zonas
                                    </div>
                                  )}

                                  {/* Resumen global */}
                                  <div className="pt-3 mt-3 border-t-2 border-[#e6e8eb] dark:border-slate-700">
                                    <div className="text-[10px] text-[#617589] dark:text-slate-400 uppercase font-semibold mb-2">
                                      Estado Global del Período
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold ${
                                          periodo.cerrado_operativo 
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' 
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                          <span className="material-symbols-outlined text-base">
                                            {periodo.cerrado_operativo ? 'check_circle' : 'schedule'}
                                          </span>
                                          Oper. {periodo.cerrado_operativo ? 'OK' : 'Pendiente'}
                                        </span>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs font-bold ${
                                          periodo.cerrado_contable 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                          <span className="material-symbols-outlined text-base">
                                            {periodo.cerrado_contable ? 'check_circle' : 'schedule'}
                                          </span>
                                          Cont. {periodo.cerrado_contable ? 'OK' : 'Pendiente'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Observaciones para Cierre Contable */}
      {showModalObservaciones && periodoSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
              <h2 className="text-2xl font-bold text-[#111418] dark:text-white">Cerrar Periodo Contable</h2>
              <button
                onClick={() => {
                  setShowModalObservaciones(false);
                  setPeriodoSeleccionado(null);
                  setObservaciones('');
                }}
                className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">info</span>
                  <div className="flex-1 text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-semibold mb-1">
                      {periodoSeleccionado.zona_nombre} - {getMesNombre(periodoSeleccionado.mes)} {periodoSeleccionado.anio}
                    </p>
                    <p>
                      Estás a punto de cerrar el periodo contable de esta zona. 
                      No se podrán realizar cambios hasta que se reabra.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Notas adicionales sobre este cierre..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => {
                  setShowModalObservaciones(false);
                  setPeriodoSeleccionado(null);
                  setObservaciones('');
                }}
                disabled={togglePeriodoContableMutation.isPending}
                className="flex-1 px-6 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-[#0d1b2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarCierreContable}
                disabled={togglePeriodoContableMutation.isPending}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {togglePeriodoContableMutation.isPending ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Ejercicio */}
      {showModalNuevo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
              <h2 className="text-2xl font-bold text-[#111418] dark:text-white">Nuevo Ejercicio Fiscal</h2>
              <button
                onClick={() => setShowModalNuevo(false)}
                className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                  Año <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={nuevoEjercicio.anio}
                  onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, anio: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2027"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nuevoEjercicio.nombre}
                  onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, nombre: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ejercicio Fiscal 2027"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={nuevoEjercicio.descripcion}
                  onChange={(e) => setNuevoEjercicio({ ...nuevoEjercicio, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descripción del ejercicio fiscal..."
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-[#e6e8eb] dark:border-slate-700">
              <button
                onClick={() => setShowModalNuevo(false)}
                disabled={createMutation.isPending}
                className="flex-1 px-6 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-[#0d1b2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEjercicio}
                disabled={createMutation.isPending}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear Ejercicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
