import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import financieroService from '../services/financieroService';
import toast from 'react-hot-toast';

interface EstacionFinanciera {
  estacion_id: string;
  estacion_nombre: string;
  merma_generada: number;
  entregas_realizadas: number;
  gastos_realizados: number;
  saldo_resguardo: number;
}

interface ModalRegistrarEntregaProps {
  estaciones: EstacionFinanciera[];
  zona_id: string;
  zona_nombre: string;
  onClose: () => void;
  periodo: { mes: number; anio: number };
}

export default function ModalRegistrarEntrega({ 
  estaciones, 
  zona_id,
  zona_nombre,
  onClose, 
  periodo 
}: ModalRegistrarEntregaProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    estacion_id: '',
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    concepto: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular mes y año desde la fecha del formulario
  const fechaSeleccionada = formData.fecha ? new Date(formData.fecha + 'T00:00:00') : new Date();
  const mesFormulario = fechaSeleccionada.getMonth() + 1;
  const anioFormulario = fechaSeleccionada.getFullYear();

  // Verificar estado del período (abierto/cerrado)
  const { data: estadoPeriodo, isLoading: loadingEstado } = useQuery({
    queryKey: ['estado-periodo-entrega', formData.estacion_id, mesFormulario, anioFormulario],
    queryFn: () => financieroService.verificarEstadoPeriodo(
      'estacion',
      formData.estacion_id,
      mesFormulario,
      anioFormulario
    ),
    enabled: !!formData.estacion_id && !!formData.fecha,
  });

  // Obtener resguardo actualizado basado en la fecha del formulario
  const { data: resguardoActualizado, isLoading: loadingResguardo } = useQuery({
    queryKey: ['resguardo-estacion', formData.estacion_id, mesFormulario, anioFormulario],
    queryFn: () => financieroService.obtenerResguardoEstacion(
      formData.estacion_id,
      mesFormulario,
      anioFormulario
    ),
    enabled: !!formData.estacion_id && !!formData.fecha,
  });

  // Obtener información de la estación seleccionada
  // SIEMPRE usar el resguardo actualizado basado en la fecha del modal
  // NO mezclar con datos del dashboard
  const estacionSeleccionada = resguardoActualizado;

  const registrarMutation = useMutation({
    mutationFn: (data: any) => financieroService.registrarEntrega(data),
    onSuccess: () => {
      toast.success('Entrega registrada exitosamente');
      // Invalidar todas las queries relacionadas con el dashboard y resguardo
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['resguardo-estacion'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-financiero'] });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al registrar la entrega';
      toast.error(errorMessage);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.estacion_id) {
      newErrors.estacion_id = 'Seleccione una estación';
    }
    if (!formData.fecha) {
      newErrors.fecha = 'Ingrese la fecha de la entrega';
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido mayor a cero';
    } else if (estacionSeleccionada) {
      // Redondear ambos valores a 2 decimales para evitar errores de precisión de punto flotante
      const montoIngresado = Math.round(parseFloat(formData.monto) * 100) / 100;
      const saldoDisponible = Math.round(estacionSeleccionada.saldo_resguardo * 100) / 100;
      
      if (montoIngresado > saldoDisponible) {
        // BLOQUEAR si excede el saldo disponible
        newErrors.monto = `El monto excede el saldo disponible de la estación ($${estacionSeleccionada.saldo_resguardo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}). No se puede entregar más de lo que tiene.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 || (newErrors.monto && newErrors.monto.startsWith('⚠️'));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    registrarMutation.mutate({
      tipo_entrega: 'estacion_zona',
      estacion_id: formData.estacion_id,
      zona_id: zona_id,
      fecha: formData.fecha,
      monto: parseFloat(formData.monto),
      concepto: formData.concepto || `Entrega de ${estacionSeleccionada?.estacion_nombre}`,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white">Registrar Entrega de Estación</h2>
            <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">
              {zona_nombre} - {new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
                new Date(periodo.anio, periodo.mes - 1)
              )}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
              💰 Recibir dinero de una estación hacia la zona
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Banner de estado del período */}
        {loadingEstado && formData.estacion_id && (
          <div className="mx-6 mt-6 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-[#617589] dark:text-slate-400">Verificando estado del período...</span>
          </div>
        )}
        
        {estadoPeriodo && !estadoPeriodo.periodo_abierto && (
          <div className="mx-6 mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-700">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 mr-3 text-3xl">lock</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-1">
                  ⚠️ Período Cerrado
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                  {estadoPeriodo.mensaje}
                </p>
                <div className="text-xs text-red-600 dark:text-red-500 space-y-1">
                  {estadoPeriodo.cierre_operativo && (
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-sm mr-1">cancel</span>
                      <span>Cierre operativo activo</span>
                    </div>
                  )}
                  {estadoPeriodo.cierre_contable && (
                    <div className="flex items-center">
                      <span className="material-symbols-outlined text-sm mr-1">verified</span>
                      <span>Liquidación contable cerrada</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-red-600 dark:text-red-500 mt-3 font-semibold">
                  No se pueden registrar entregas en este período. Contacta al gerente de zona o administrador para reabrirlo.
                </p>
              </div>
            </div>
          </div>
        )}

        {estadoPeriodo && estadoPeriodo.periodo_abierto && formData.estacion_id && (
          <div className="mx-6 mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 flex items-center">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-2 text-xl">check_circle</span>
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              Período abierto - Puedes registrar entregas
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Estación */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Estación <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.estacion_id}
              onChange={(e) => handleChange('estacion_id', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.estacion_id
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
            >
              <option value="">Seleccione una estación</option>
              {estaciones.map((est) => (
                <option key={est.estacion_id} value={est.estacion_id}>
                  {est.estacion_nombre}
                </option>
              ))}
            </select>
            {errors.estacion_id && (
              <p className="text-red-500 text-sm mt-1">{errors.estacion_id}</p>
            )}
            {!formData.estacion_id && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 Selecciona una estación para ver su resguardo disponible en la fecha indicada
              </p>
            )}
          </div>

          {/* Información de la estación seleccionada */}
          {loadingResguardo && formData.estacion_id && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-[#617589] dark:text-slate-400">Calculando resguardo...</span>
            </div>
          )}
          {estacionSeleccionada && !loadingResguardo && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/50 dark:to-slate-700/50 border-2 border-blue-300 dark:border-blue-600">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-[#111418] dark:text-white flex items-center">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-2">account_balance</span>
                  {estacionSeleccionada.estacion_nombre}
                </h3>
                <span className="text-xs font-bold text-white dark:text-white px-3 py-1 bg-blue-600 dark:bg-blue-500 rounded-full shadow-sm">
                  📅 {new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(fechaSeleccionada).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3 flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">info</span>
                Datos calculados para la fecha seleccionada arriba
              </p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#617589] dark:text-slate-400">Merma Generada:</p>
                  <p className="font-bold text-green-600 dark:text-green-400">
                    ${estacionSeleccionada.merma_generada.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[#617589] dark:text-slate-400">Entregas Anteriores:</p>
                  <p className="font-medium text-[#111418] dark:text-white">
                    ${estacionSeleccionada.entregas_realizadas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[#617589] dark:text-slate-400">Gastos Realizados:</p>
                  <p className="font-medium text-[#111418] dark:text-white">
                    ${estacionSeleccionada.gastos_realizados.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="col-span-2 pt-2 border-t border-blue-200 dark:border-slate-600">
                  <p className="text-[#617589] dark:text-slate-400">En Resguardo:</p>
                  <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
                    ${estacionSeleccionada.saldo_resguardo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Fecha de Entrega <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.fecha
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
            />
            {errors.fecha && (
              <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Monto de la Entrega <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#617589] dark:text-slate-400 font-medium">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => handleChange('monto', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 rounded-lg border ${
                  errors.monto && !errors.monto.startsWith('⚠️')
                    ? 'border-red-500 focus:ring-red-500'
                    : errors.monto
                    ? 'border-yellow-500 focus:ring-yellow-500'
                    : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
                } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              />
            </div>
            {errors.monto && (
              <p className={`text-sm mt-1 ${errors.monto.startsWith('⚠️') ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}>
                {errors.monto}
              </p>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Concepto / Nota (Opcional)
            </label>
            <textarea
              value={formData.concepto}
              onChange={(e) => handleChange('concepto', e.target.value)}
              placeholder="Ej: Entrega parcial del mes, entrega extraordinaria..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4] resize-none transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={registrarMutation.isPending}
              className="flex-1 px-6 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-[#0d1b2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registrarMutation.isPending || (estadoPeriodo && !estadoPeriodo.periodo_abierto)}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registrarMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">payments</span>
                  Registrar Entrega
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
