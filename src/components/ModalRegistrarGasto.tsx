import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sileo } from 'sileo';
import financieroService from '../services/financieroService';

interface ModalRegistrarGastoProps {
  estaciones?: Array<{ id: string; nombre: string }>;
  zona?: { id: string; nombre: string };
  onClose: () => void;
  periodo: { mes: number; anio: number };
  tipo: 'estacion' | 'zona';
}

const categorias = [
  'General',
  'Mantenimiento',
  'Servicios',
  'Nómina',
  'Suministros',
  'Combustible',
  'Reparaciones',
  'Otros',
];

export default function ModalRegistrarGasto({ estaciones, zona, onClose, periodo, tipo }: ModalRegistrarGastoProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    estacion_id: tipo === 'estacion' && estaciones?.length === 1 ? estaciones[0].id : '',
    zona_id: tipo === 'zona' && zona ? zona.id : '',
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    concepto: '',
    categoria: 'General',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular mes y año desde la fecha del formulario
  const fechaSeleccionada = formData.fecha ? new Date(formData.fecha + 'T00:00:00') : new Date();
  const mesFormulario = fechaSeleccionada.getMonth() + 1;
  const anioFormulario = fechaSeleccionada.getFullYear();

  // ID de la entidad (estación o zona)
  const entidadId = tipo === 'estacion' ? formData.estacion_id : formData.zona_id;

  // Verificar estado del período (abierto/cerrado)
  const { data: estadoPeriodo, isLoading: loadingEstado } = useQuery({
    queryKey: ['estado-periodo', tipo, entidadId, mesFormulario, anioFormulario],
    queryFn: () => financieroService.verificarEstadoPeriodo(
      tipo,
      entidadId,
      mesFormulario,
      anioFormulario
    ),
    enabled: !!entidadId && !!formData.fecha,
  });

  // Obtener límite disponible basado en la fecha del formulario
  const { data: limiteData, isLoading: loadingLimite } = useQuery({
    queryKey: ['limite-disponible', tipo, entidadId, mesFormulario, anioFormulario],
    queryFn: () => financieroService.obtenerLimiteDisponible(
      tipo,
      entidadId,
      mesFormulario,
      anioFormulario
    ),
    enabled: !!entidadId && !!formData.fecha,
  });

  const registrarMutation = useMutation({
    mutationFn: (data: any) => financieroService.registrarGasto(data),
    onSuccess: () => {
      sileo.success({ title: 'Gasto registrado exitosamente' });
      // Invalidar todas las queries relacionadas con el dashboard y resguardo
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] });
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      queryClient.invalidateQueries({ queryKey: ['resguardo-estacion'] });
      queryClient.invalidateQueries({ queryKey: ['limite-disponible'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-financiero'] });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al registrar el gasto';
      sileo.error({ title: errorMessage });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (tipo === 'estacion' && !formData.estacion_id) {
      newErrors.estacion_id = 'Seleccione una estación';
    }
    if (tipo === 'zona' && !formData.zona_id) {
      newErrors.zona_id = 'Zona no especificada';
    }
    if (!formData.fecha) {
      newErrors.fecha = 'Ingrese la fecha del gasto';
    }
    if (!formData.monto || parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'Ingrese un monto válido mayor a cero';
    } else if (limiteData) {
      const montoIngresado = parseFloat(formData.monto);
      const tolerancia = 0.000001;
      if (montoIngresado - limiteData.disponible > tolerancia) {
        newErrors.monto = `El monto excede el disponible real para gastar ($${limiteData.disponible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
      }
    }
    if (!formData.concepto.trim()) {
      newErrors.concepto = 'Ingrese el concepto del gasto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const data: any = {
      fecha: formData.fecha,
      monto: parseFloat(formData.monto),
      concepto: formData.concepto,
      categoria: formData.categoria,
    };

    if (tipo === 'estacion') {
      data.estacion_id = formData.estacion_id;
    } else {
      data.zona_id = formData.zona_id;
    }

    registrarMutation.mutate(data);
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
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white">
              Registrar Gasto {tipo === 'zona' ? 'de Zona' : 'de Estación'}
            </h2>
            <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">
              {zona && tipo === 'zona' ? zona.nombre + ' - ' : ''}
              {new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(
                new Date(periodo.anio, periodo.mes - 1)
              )}
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
        {loadingEstado && entidadId && (
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
                  No se pueden registrar gastos en este período. Contacta al gerente de zona o administrador para reabrirlo.
                </p>
              </div>
            </div>
          </div>
        )}

        {estadoPeriodo && estadoPeriodo.periodo_abierto && (
          <div className="mx-6 mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 flex items-center">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 mr-2 text-xl">check_circle</span>
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              Período abierto - Puedes registrar gastos
            </span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Estación (solo si tipo === 'estacion') */}
          {tipo === 'estacion' && estaciones && (
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
                disabled={estaciones.length === 1}
              >
                <option value="">Seleccione una estación</option>
                {estaciones.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nombre}
                  </option>
                ))}
              </select>
              {errors.estacion_id && (
                <p className="text-red-500 text-sm mt-1">{errors.estacion_id}</p>
              )}
            </div>
          )}

          {/* Zona (solo si tipo === 'zona') */}
          {tipo === 'zona' && zona && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-600">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3 text-3xl">location_city</span>
                <div>
                  <p className="text-xs text-[#617589] dark:text-slate-400 uppercase font-semibold">Gasto de Zona</p>
                  <p className="text-lg font-bold text-[#111418] dark:text-white">{zona.nombre}</p>
                </div>
              </div>
            </div>
          )}

          {/* Fecha y Categoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                Fecha <span className="text-red-500">*</span>
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

            <div>
              <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
                Categoría
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => handleChange('categoria', e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[#dbe0e6] dark:border-slate-600 bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1173d4] transition-colors"
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Monto <span className="text-red-500">*</span>
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
                  errors.monto
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
                } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              />
            </div>
            {errors.monto && (
              <p className="text-red-500 text-sm mt-1">{errors.monto}</p>
            )}
            {loadingLimite && formData.estacion_id && (
              <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-[#617589] dark:text-slate-400">Calculando límite disponible...</span>
              </div>
            )}
            {limiteData && !loadingLimite && (
              <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700">
                <div className="mb-2 pb-2 border-b border-blue-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Límite para {new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(fechaSeleccionada)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#617589] dark:text-slate-400">Límite mensual:</span>
                  <span className="font-semibold text-[#111418] dark:text-white">
                    ${limiteData.limite_gastos.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[#617589] dark:text-slate-400">Gastado:</span>
                  <span className="text-orange-600 dark:text-orange-400 font-medium">
                    ${limiteData.gastos_acumulados.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-blue-200 dark:border-slate-700">
                  <span className="text-[#617589] dark:text-slate-400">Disponible por límite:</span>
                  <span className="font-semibold text-[#111418] dark:text-white">
                    ${limiteData.disponible_por_limite.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-[#617589] dark:text-slate-400">Disponible por resguardo:</span>
                  <span className="font-semibold text-[#111418] dark:text-white">
                    ${limiteData.disponible_por_resguardo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1 pt-2 border-t border-blue-200 dark:border-slate-700">
                  <span className="text-[#617589] dark:text-slate-400 font-semibold">Disponible real para gastar:</span>
                  <span className={`font-bold ${limiteData.disponible > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${limiteData.disponible.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {limiteData.disponible <= 0 && (
                  <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900">
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
                      <span className="material-symbols-outlined text-base mr-1">warning</span>
                      Límite agotado para este mes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">
              Concepto / Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.concepto}
              onChange={(e) => handleChange('concepto', e.target.value)}
              placeholder="Describe el motivo del gasto..."
              rows={4}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.concepto
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 resize-none transition-colors`}
            />
            {errors.concepto && (
              <p className="text-red-500 text-sm mt-1">{errors.concepto}</p>
            )}
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
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {registrarMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">receipt_long</span>
                  Registrar Gasto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
