import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

interface ModalLiquidarPeriodoProps {
  estaciones: EstacionFinanciera[];
  zona_nombre: string;
  periodo: { mes: number; anio: number };
  resguardo_zona: number;
  saldo_pendiente: number;
  onClose: () => void;
}

export default function ModalLiquidarPeriodo({ 
  estaciones, 
  zona_nombre,
  periodo,
  resguardo_zona,
  saldo_pendiente,
  onClose 
}: ModalLiquidarPeriodoProps) {
  const queryClient = useQueryClient();
  
  const [observaciones, setObservaciones] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validar estaciones
  const estacionesConSaldo = estaciones.filter(e => {
    const merma = parseFloat(e.merma_generada.toString());
    const saldo = parseFloat(e.saldo_resguardo.toString());
    return merma > 0 && saldo !== 0;
  });

  const puedenLiquidar = estacionesConSaldo.length === 0;

  const liquidarMutation = useMutation({
    mutationFn: () => financieroService.cerrarPeriodoContable(
      periodo.mes,
      periodo.anio,
      observaciones || undefined
    ),
    onSuccess: () => {
      toast.success('Período liquidado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] });
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || 'Error al liquidar período';
      const detalle = error?.response?.data?.detalle;
      const estacionesPendientes = error?.response?.data?.estaciones_pendientes;
      
      if (estacionesPendientes) {
        toast.error(
          <div>
            <p className="font-bold">{errorMessage}</p>
            <ul className="mt-2 text-sm">
              {estacionesPendientes.map((e: any) => (
                <li key={e.nombre}>
                  {e.nombre}: ${e.saldo.toLocaleString('es-MX', { minimumFractionDigits: 4 })}
                </li>
              ))}
            </ul>
          </div>,
          { duration: 6000 }
        );
      } else if (detalle) {
        toast.error(`${errorMessage}\n${detalle}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleLiquidar = () => {
    if (!puedenLiquidar) {
      toast.error('No se puede liquidar. Hay estaciones con saldo pendiente.');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    liquidarMutation.mutate();
  };

  const formatMes = (mes: number) => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mes - 1];
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1a2632] rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#1a2632] border-b border-[#e6e8eb] dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white flex items-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-3 text-3xl">
                receipt_long
              </span>
              Liquidar Período
            </h2>
            <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">
              {zona_nombre} - {formatMes(periodo.mes)} {periodo.anio}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#60758a] hover:text-[#111418] dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Resumen de la Zona */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-[#111418] dark:text-white mb-4 flex items-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-2">
                account_balance_wallet
              </span>
              Resumen Financiero
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-[#60758a] dark:text-gray-400">Resguardo en Zona</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${resguardo_zona.toLocaleString('es-MX', { minimumFractionDigits: 4 })}
                </div>
              </div>
              <div>
                <div className="text-sm text-[#60758a] dark:text-gray-400">Pendiente en Estaciones</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${saldo_pendiente.toLocaleString('es-MX', { minimumFractionDigits: 4 })}
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Liquidación */}
          {puedenLiquidar ? (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-start">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl mr-3">
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold text-green-800 dark:text-green-300">Listo para Liquidar</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                    Todas las estaciones con actividad están en saldo $0.00. Puedes proceder con la liquidación del período.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl mr-3">
                  error
                </span>
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300">No se puede Liquidar</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                    Hay {estacionesConSaldo.length} estación(es) con saldo pendiente. Deben estar en $0.00 para liquidar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Listado de Estaciones Pendientes */}
          {estacionesConSaldo.length > 0 && (
            <div>
              <h4 className="font-bold text-[#111418] dark:text-white mb-3">
                Estaciones con Saldo Pendiente
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {estacionesConSaldo.map(est => (
                  <div 
                    key={est.estacion_id}
                    className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <span className="font-medium text-[#111418] dark:text-white">
                      {est.estacion_nombre}
                    </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      ${parseFloat(est.saldo_resguardo.toString()).toLocaleString('es-MX', { minimumFractionDigits: 4 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-[#111418] dark:text-white mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-[#dde1e6] dark:border-slate-600 
                       bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Notas adicionales sobre esta liquidación..."
              disabled={!puedenLiquidar}
            />
          </div>

          {/* Información Importante */}
          <div className="bg-blue-50 dark:bg-slate-800/50 rounded-lg p-4 border border-blue-200 dark:border-slate-700">
            <h4 className="font-bold text-[#111418] dark:text-white mb-2 flex items-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mr-2">
                info
              </span>
              Importante
            </h4>
            <ul className="text-sm text-[#60758a] dark:text-gray-400 space-y-1 ml-8">
              <li>• El saldo final de zona pasará como saldo inicial del siguiente mes</li>
              <li>• No se podrán registrar gastos ni entregas después de liquidar</li>
              <li>• Podrás reabrir el período si necesitas hacer correcciones</li>
              <li>• Se generará un registro permanente de esta liquidación</li>
            </ul>
          </div>
        </div>

        {/* Footer con Botones */}
        <div className="sticky bottom-0 bg-white dark:bg-[#1a2632] border-t border-[#e6e8eb] dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-[#dde1e6] dark:border-slate-600 
                     text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 
                     transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleLiquidar}
            disabled={!puedenLiquidar || liquidarMutation.isPending}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 
                     dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium 
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center gap-2"
          >
            {liquidarMutation.isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">check_circle</span>
                Liquidar Período
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-[#1a2632] rounded-xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-start mb-4">
              <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-4xl mr-3">
                warning
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
                  Confirmar Liquidación
                </h3>
                <p className="text-sm text-[#60758a] dark:text-gray-400">
                  ¿Estás seguro de liquidar el período de <strong>{formatMes(periodo.mes)} {periodo.anio}</strong>?
                </p>
                <p className="text-sm text-[#60758a] dark:text-gray-400 mt-2">
                  Esta acción bloqueará el registro de gastos y entregas para este período.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 rounded-lg border border-[#dde1e6] dark:border-slate-600 
                         text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sí, Liquidar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
