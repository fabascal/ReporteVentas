import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  validarCierrePeriodo,
  obtenerEstadoCierre,
  cerrarPeriodo,
  reabrirPeriodo,
} from '../services/cierreMensualService';
import { CierreRequest } from '../types/cierreMensual';
import { formatFechaHora } from '../utils/dateUtils';
import { sileo } from 'sileo';

interface CierreMensualModalProps {
  isOpen: boolean;
  onClose: () => void;
  zonaId: string;
  zonaNombre: string;
  anio: number;
  mes: number;
  mesNombre: string;
}

export const CierreMensualModal: React.FC<CierreMensualModalProps> = ({
  isOpen,
  onClose,
  zonaId,
  zonaNombre,
  anio,
  mes,
  mesNombre,
}) => {
  const [observaciones, setObservaciones] = useState('');
  const queryClient = useQueryClient();
  const usuarioRol = localStorage.getItem('rol');

  // Query para obtener estado del cierre
  const { data: estadoCierre, isLoading: loadingEstado, error: errorEstado } = useQuery({
    queryKey: ['cierre-estado', zonaId, anio, mes],
    queryFn: () => obtenerEstadoCierre(zonaId, anio, mes),
    enabled: isOpen,
    retry: 2,
  });

  // Query para validar si se puede cerrar
  const { data: validacion, isLoading: loadingValidacion, error: errorValidacion } = useQuery({
    queryKey: ['cierre-validacion', zonaId, anio, mes],
    queryFn: () => validarCierrePeriodo(zonaId, anio, mes),
    enabled: isOpen && !estadoCierre?.esta_cerrado,
    retry: 2,
  });

  // Mutation para cerrar período
  const cerrarMutation = useMutation({
    mutationFn: (data: CierreRequest) => cerrarPeriodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cierre-estado'] });
      queryClient.invalidateQueries({ queryKey: ['cierre-validacion'] });
      queryClient.invalidateQueries({ queryKey: ['cierres-zona'] });
      sileo.success({ title: 'Período cerrado exitosamente' });
      onClose();
    },
    onError: (error: any) => {
      sileo.error({ title: error.response?.data?.error || 'Error al cerrar el período' });
    },
  });

  // Mutation para reabrir período
  const reabrirMutation = useMutation({
    mutationFn: () => reabrirPeriodo({ zonaId, anio, mes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cierre-estado'] });
      queryClient.invalidateQueries({ queryKey: ['cierre-validacion'] });
      queryClient.invalidateQueries({ queryKey: ['cierres-zona'] });
      sileo.success({ title: 'Período reabierto exitosamente' });
      onClose();
    },
    onError: (error: any) => {
      sileo.error({ title: error.response?.data?.error || 'Error al reabrir el período' });
    },
  });

  const handleCerrar = () => {
    if (!validacion?.puede_cerrar) {
      sileo.warning({ title: 'No se puede cerrar el período. Verifica que todas las estaciones estén completas.' });
      return;
    }

    if (window.confirm(`¿Estás seguro de cerrar el período ${mesNombre} para ${zonaNombre}? Esta acción generará el resumen mensual.`)) {
      cerrarMutation.mutate({ zonaId, anio, mes, observaciones });
    }
  };

  const handleReabrir = () => {
    if (window.confirm(`¿Estás seguro de reabrir el período ${mesNombre} para ${zonaNombre}? Esto eliminará el resumen mensual generado.`)) {
      reabrirMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">calendar_month</span>
                Cierre Mensual
              </h2>
              <p className="text-blue-100 mt-1">
                {mesNombre} - {zonaNombre}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingEstado || loadingValidacion ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 dark:text-gray-400">Cargando información del período...</p>
            </div>
          ) : errorEstado || errorValidacion ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">
                  error
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-red-800 dark:text-red-200 text-lg mb-2">
                    Error al cargar información
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {(errorEstado as any)?.response?.data?.error || 
                     (errorValidacion as any)?.response?.data?.error || 
                     'No se pudo conectar con el servidor. Por favor, intenta de nuevo.'}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Estado del cierre */}
              {estadoCierre?.esta_cerrado ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">
                      check_circle
                    </span>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-800 dark:text-green-200 text-lg mb-2">
                        Período Cerrado
                      </h3>
                      <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                        <p>
                          <strong>Cerrado por:</strong> {estadoCierre.cierre?.cerrado_por_nombre}
                        </p>
                        <p>
                          <strong>Fecha:</strong>{' '}
                          {formatFechaHora(estadoCierre.cierre?.fecha_cierre)}
                        </p>
                        {estadoCierre.cierre?.observaciones && (
                          <p>
                            <strong>Observaciones:</strong> {estadoCierre.cierre.observaciones}
                          </p>
                        )}
                      </div>
                      {usuarioRol === 'admin' && (
                        <button
                          onClick={handleReabrir}
                          disabled={reabrirMutation.isPending}
                          className="mt-3 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">lock_open</span>
                          {reabrirMutation.isPending ? 'Reabriendo...' : 'Reabrir Período'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Validación */}
                  {validacion && (
                    <div
                      className={`border rounded-lg p-4 mb-6 ${
                        validacion.puede_cerrar
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`material-symbols-outlined text-3xl ${
                            validacion.puede_cerrar
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}
                        >
                          {validacion.puede_cerrar ? 'check_circle' : 'warning'}
                        </span>
                        <div className="flex-1">
                          <h3
                            className={`font-bold text-lg mb-2 ${
                              validacion.puede_cerrar
                                ? 'text-green-800 dark:text-green-200'
                                : 'text-yellow-800 dark:text-yellow-200'
                            }`}
                          >
                            {validacion.mensaje}
                          </h3>
                          <div
                            className={`grid grid-cols-3 gap-4 text-sm ${
                              validacion.puede_cerrar
                                ? 'text-green-700 dark:text-green-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}
                          >
                            <div>
                              <p className="font-semibold">Total Estaciones:</p>
                              <p className="text-2xl font-bold">{validacion.total_estaciones}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Estaciones Completas:</p>
                              <p className="text-2xl font-bold">{validacion.estaciones_completas}</p>
                            </div>
                            <div>
                              <p className="font-semibold">Días en el Mes:</p>
                              <p className="text-2xl font-bold">{validacion.dias_en_mes}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalles por estación */}
                  {validacion && validacion.estaciones.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-white">
                        Estado de Estaciones
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Estación</th>
                              <th className="px-4 py-3 text-center font-semibold">Días Aprobados</th>
                              <th className="px-4 py-3 text-center font-semibold">Requeridos</th>
                              <th className="px-4 py-3 text-center font-semibold">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {validacion.estaciones.map((est) => {
                              const diasAprobados = parseInt(est.dias_aprobados) || 0;
                              const totalDias = parseInt(est.total_dias) || 0;
                              const completa = diasAprobados === totalDias && totalDias > 0;
                              return (
                                <tr
                                  key={est.id}
                                  className={
                                    completa
                                      ? 'bg-green-50 dark:bg-green-900/10'
                                      : 'bg-yellow-50 dark:bg-yellow-900/10'
                                  }
                                >
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-semibold text-gray-800 dark:text-white">
                                        {est.nombre}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {est.clave}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-center font-semibold">
                                    {diasAprobados}
                                  </td>
                                  <td className="px-4 py-3 text-center">{totalDias}</td>
                                  <td className="px-4 py-3 text-center">
                                    {completa ? (
                                      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-semibold">
                                        <span className="material-symbols-outlined text-sm">
                                          check_circle
                                        </span>
                                        Completa
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-yellow-700 dark:text-yellow-400 font-semibold">
                                        <span className="material-symbols-outlined text-sm">
                                          warning
                                        </span>
                                        Incompleta
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Observaciones */}
                  {validacion?.puede_cerrar && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Observaciones (opcional)
                      </label>
                      <textarea
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        placeholder="Escribe cualquier observación sobre este cierre..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loadingEstado && !loadingValidacion && !estadoCierre?.esta_cerrado && (
          <div className="border-t dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              {validacion?.puede_cerrar && (
                <button
                  onClick={handleCerrar}
                  disabled={cerrarMutation.isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">lock</span>
                  {cerrarMutation.isPending ? 'Cerrando...' : 'Cerrar Período'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
