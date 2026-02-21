import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sileo } from 'sileo';
import financieroService from '../services/financieroService';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';

interface ModalFirmarEntregasProps {
  mes: number;
  anio: number;
  onClose: () => void;
}

export default function ModalFirmarEntregas({ mes, anio, onClose }: ModalFirmarEntregasProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const firmaDireccion = user?.role === Role.Direccion || user?.role === Role.DirectorOperaciones;

  const { data, isLoading } = useQuery({
    queryKey: ['entregas-pendientes-firma', mes, anio, user?.role],
    queryFn: () => financieroService.obtenerEntregasPendientesFirma(mes, anio),
  });

  const firmarMutation = useMutation({
    mutationFn: (entregaId: string) => financieroService.firmarEntrega(entregaId),
    onSuccess: () => {
      sileo.success({ title: 'Entrega firmada de conformidad' });
      queryClient.invalidateQueries({ queryKey: ['entregas-pendientes-firma'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-financiero'] });
    },
    onError: (error: any) => {
      sileo.error({ title: error?.response?.data?.error || 'Error al firmar entrega' });
    },
  });

  const entregas = data?.entregas || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white">
              {firmaDireccion ? 'Firmar Entregas de Zona a Dirección' : 'Firmar Entregas de Estaciones'}
            </h2>
            <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">
              {firmaDireccion
                ? 'Revisión de transferencias enviadas por gerencia de zona'
                : 'Revisión y conformidad de entregas pendientes'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span className="text-sm text-[#617589] dark:text-slate-400">Cargando entregas pendientes...</span>
            </div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-10 text-[#617589] dark:text-slate-400">
              No hay entregas pendientes de firma para este período.
            </div>
          ) : (
            <div className="space-y-3">
              {entregas.map((entrega: any) => (
                <div
                  key={entrega.id}
                  className="rounded-lg border border-[#e6e8eb] dark:border-slate-700 p-4 bg-gray-50 dark:bg-[#0d1b2a]"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#111418] dark:text-white">
                        {firmaDireccion ? entrega.zona_nombre : entrega.estacion_nombre} - ${Number(entrega.monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-[#617589] dark:text-slate-400">
                        Fecha: {new Date(entrega.fecha).toLocaleDateString('es-MX')} | Registró: {entrega.capturado_por_nombre || '-'}
                      </p>
                      {firmaDireccion && (
                        <p className="text-sm text-[#617589] dark:text-slate-400">
                          Tipo: Entrega zona a dirección
                        </p>
                      )}
                      {firmaDireccion && entrega.destinatario_nombre && (
                        <p className="text-sm text-[#617589] dark:text-slate-400">
                          Destino: {entrega.destinatario_nombre}
                        </p>
                      )}
                      <p className="text-sm text-[#617589] dark:text-slate-400">
                        Concepto: {entrega.concepto || 'Sin concepto'}
                      </p>
                      {entrega.archivo_nombre && (
                        <p className="text-sm text-[#617589] dark:text-slate-400">
                          Archivo: {entrega.archivo_nombre}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => firmarMutation.mutate(entrega.id)}
                      disabled={firmarMutation.isPending}
                      className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined mr-1 text-[18px]">verified</span>
                      {firmaDireccion ? 'Firmar Recepción' : 'Firmar Conformidad'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
