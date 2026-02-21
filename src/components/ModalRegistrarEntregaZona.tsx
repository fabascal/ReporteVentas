import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sileo } from 'sileo';
import financieroService from '../services/financieroService';

interface ModalRegistrarEntregaZonaProps {
  zona: { id: string; nombre: string };
  onClose: () => void;
  periodo: { mes: number; anio: number };
}

export default function ModalRegistrarEntregaZona({
  zona,
  onClose,
  periodo,
}: ModalRegistrarEntregaZonaProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    concepto: '',
    destinatario_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: firmantesData, isLoading: loadingFirmantes } = useQuery({
    queryKey: ['firmantes-direccion'],
    queryFn: () => financieroService.obtenerFirmantesDireccion(),
  });

  const firmantes = firmantesData?.usuarios || [];

  const registrarMutation = useMutation({
    mutationFn: () =>
      financieroService.registrarEntrega({
        tipo_entrega: 'zona_direccion',
        zona_id: zona.id,
        fecha: formData.fecha,
        monto: parseFloat(formData.monto),
        concepto: formData.concepto.trim(),
        destinatario_id: formData.destinatario_id,
      }),
    onSuccess: () => {
      sileo.success({ title: 'Entrega enviada para firma de dirección' });
      queryClient.invalidateQueries({ queryKey: ['dashboard-financiero'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-financiero'] });
      queryClient.invalidateQueries({ queryKey: ['entregas-pendientes-firma'] });
      onClose();
    },
    onError: (error: any) => {
      sileo.error({
        title: error?.response?.data?.error || 'Error al registrar la entrega',
        description: error?.response?.data?.detalle || '',
      });
    },
  });

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!formData.fecha) nextErrors.fecha = 'Ingrese la fecha de la entrega';
    if (!formData.monto || Number(formData.monto) <= 0) nextErrors.monto = 'Ingrese un monto válido mayor a cero';
    if (!formData.concepto.trim()) nextErrors.concepto = 'Ingrese el concepto de la entrega';
    if (!formData.destinatario_id) nextErrors.destinatario_id = 'Seleccione el usuario de destino';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    registrarMutation.mutate();
  };

  const handleChange = (field: 'fecha' | 'monto' | 'concepto' | 'destinatario_id', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-[#111418] dark:text-white">Entrega Zona a Dirección</h2>
            <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">
              {zona.nombre} - {new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(periodo.anio, periodo.mes - 1))}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#617589] dark:text-slate-400 hover:text-[#111418] dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <div className="mx-6 mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Esta entrega la inicia Gerente de Zona y queda en <strong>pendiente de firma</strong> hasta que Dirección o Director Operaciones la confirme.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">Enviar a</label>
            <select
              value={formData.destinatario_id}
              onChange={(e) => handleChange('destinatario_id', e.target.value)}
              disabled={loadingFirmantes}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.destinatario_id ? 'border-red-500 focus:ring-red-500' : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
            >
              <option value="">{loadingFirmantes ? 'Cargando usuarios...' : 'Seleccione usuario destino'}</option>
              {firmantes.map((firmante) => (
                <option key={firmante.id} value={firmante.id}>
                  {firmante.name} ({firmante.role})
                </option>
              ))}
            </select>
            {errors.destinatario_id && <p className="text-red-500 text-sm mt-1">{errors.destinatario_id}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">Fecha de Entrega</label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => handleChange('fecha', e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.fecha ? 'border-red-500 focus:ring-red-500' : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
            />
            {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">Monto de la Entrega</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#617589] dark:text-slate-400 font-medium">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => handleChange('monto', e.target.value)}
                placeholder="0.00"
                className={`w-full pl-8 pr-4 py-3 rounded-lg border ${
                  errors.monto ? 'border-red-500 focus:ring-red-500' : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
                } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors`}
              />
            </div>
            {errors.monto && <p className="text-red-500 text-sm mt-1">{errors.monto}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">Concepto</label>
            <textarea
              rows={3}
              value={formData.concepto}
              onChange={(e) => handleChange('concepto', e.target.value)}
              placeholder="Ej: Transferencia de resguardo mensual"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.concepto ? 'border-red-500 focus:ring-red-500' : 'border-[#dbe0e6] dark:border-slate-600 focus:ring-[#1173d4]'
              } bg-white dark:bg-[#0d1b2a] text-[#111418] dark:text-white focus:outline-none focus:ring-2 transition-colors resize-none`}
            />
            {errors.concepto && <p className="text-red-500 text-sm mt-1">{errors.concepto}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={registrarMutation.isPending}
              className="flex-1 px-6 py-3 border border-[#dbe0e6] dark:border-slate-600 text-[#111418] dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-[#0d1b2a] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registrarMutation.isPending}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {registrarMutation.isPending ? 'Enviando...' : 'Enviar a Firma'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
