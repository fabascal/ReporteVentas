import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import financieroService from '../services/financieroService';
import ejerciciosService from '../services/ejerciciosService';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types/auth';
import { Link } from 'react-router-dom';
import DynamicHeader from '../components/DynamicHeader';
import ModalRegistrarGasto from '../components/ModalRegistrarGasto';
import ModalRegistrarEntrega from '../components/ModalRegistrarEntrega';
import ModalLiquidarPeriodo from '../components/ModalLiquidarPeriodo';
import { useEjerciciosActivos } from '../hooks/useEjerciciosActivos';

export default function DashboardFinanciero() {
  const { user } = useAuth();
  const { aniosDisponibles, isLoading: loadingEjercicios } = useEjerciciosActivos();
  
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    return {
      mes: now.getMonth() + 1,
      anio: now.getFullYear(),
    };
  });

  const [showModalGasto, setShowModalGasto] = useState(false);
  const [showModalEntrega, setShowModalEntrega] = useState(false);
  const [showModalLiquidar, setShowModalLiquidar] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-financiero', periodo.mes, periodo.anio],
    queryFn: () => financieroService.getDashboard(periodo.mes, periodo.anio),
  });

  const { data: alertas } = useQuery({
    queryKey: ['alertas-financiero', periodo.mes, periodo.anio],
    queryFn: () => financieroService.getAlertas(periodo.mes, periodo.anio),
    enabled: user?.role === Role.GerenteZona || user?.role === Role.Direccion || user?.role === Role.Administrador,
  });

  // Verificar estado del periodo operativo y contable
  const zona_id = user?.zona_id;
  
  const { data: estadoPeriodoOperativo } = useQuery({
    queryKey: ['estado-periodo-operativo', zona_id, periodo.anio, periodo.mes],
    queryFn: () => ejerciciosService.verificarEstadoPeriodoOperativo(zona_id!, periodo.anio, periodo.mes),
    enabled: !!zona_id && user?.role === Role.GerenteZona,
  });

  const { data: estadoPeriodoContable } = useQuery({
    queryKey: ['estado-periodo-contable', zona_id, periodo.anio, periodo.mes],
    queryFn: () => ejerciciosService.verificarEstadoPeriodoContable(zona_id!, periodo.anio, periodo.mes),
    enabled: !!zona_id && user?.role === Role.GerenteZona,
  });

  // Obtener estaciones para el formulario (solo para GerenteEstacion)
  const estacionesParaGasto = data?.tipo === 'gerente_estacion' 
    ? data.data.estaciones.map((est: any) => ({
        id: est.estacion_id,
        nombre: est.estacion_nombre
      }))
    : [];

  // Obtener estaciones con datos financieros (para GerenteZona)
  const estacionesParaEntrega = data?.tipo === 'gerente_zona'
    ? data.data.estaciones.map((est: any) => ({
        estacion_id: est.estacion_id,
        estacion_nombre: est.estacion_nombre,
        merma_generada: parseFloat(est.merma_generada || 0),
        entregas_realizadas: parseFloat(est.entregas_realizadas || 0),
        gastos_realizados: parseFloat(est.gastos_realizados || 0),
        saldo_resguardo: parseFloat(est.saldo_resguardo || 0),
      }))
    : [];

  const zonaId = data?.tipo === 'gerente_zona' ? data.data.zona_id : '';
  const zonaNombre = data?.tipo === 'gerente_zona' ? data.data.zona_nombre : '';

  const handleMesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodo({ ...periodo, mes: parseInt(e.target.value) });
  };

  const handleAnioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriodo({ ...periodo, anio: parseInt(e.target.value) });
  };

  const formatNumber = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getMesNombre = (): string[] => {
    return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  };

  const getEstadoSaldo = (saldo: number, merma: number, entregas: number = 0) => {
    // Si no hay merma generada, está en proceso (sin actividad)
    if (merma === 0) {
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        label: 'Sin Actividad'
      };
    }
    
    // Si hay merma pero no hay entregas, está en proceso
    if (entregas === 0 && saldo > 0) {
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        label: 'En Proceso'
      };
    }
    
    // Si el saldo es 0 y hubo entregas, está liquidado
    if (saldo === 0 && entregas > 0) {
      return {
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        label: 'Liquidado'
      };
    }
    
    // Si hay saldo pendiente y ya se hicieron entregas parciales
    if (saldo > 0 && entregas > 0) {
      const porcentaje = (saldo / merma) * 100;
      if (porcentaje >= 50) {
        return {
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          label: 'Parcial'
        };
      }
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        label: 'Por Liquidar'
      };
    }
    
    // Caso por defecto
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      label: 'Pendiente'
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
        <DynamicHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-lg">Cargando dashboard financiero...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922]">
        <DynamicHeader />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-lg text-red-600">Error al cargar dashboard</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] font-display antialiased transition-colors duration-200">
      <DynamicHeader />
      <main className="flex-1 px-4 py-8 md:px-8 lg:px-12 xl:px-16 max-w-[1600px] mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-2">
                Control Financiero - Resguardos
              </h1>
              <p className="text-[#60758a] dark:text-gray-400">
                {getMesNombre()[periodo.mes - 1]} {periodo.anio}
              </p>
            </div>
            
            {/* Controles de período */}
            <div className="flex gap-3 items-center">
              <div>
                <label className="block text-sm font-medium text-[#60758a] dark:text-gray-400 mb-1">
                  Mes
                </label>
                <select
                  value={periodo.mes}
                  onChange={handleMesChange}
                  className="px-4 py-2 border border-[#e6e8eb] dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {getMesNombre().map((mes, index) => (
                    <option key={index + 1} value={index + 1}>
                      {mes}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#60758a] dark:text-gray-400 mb-1">
                  Año
                </label>
                <select
                  value={periodo.anio}
                  onChange={handleAnioChange}
                  className="px-4 py-2 border border-[#e6e8eb] dark:border-slate-700 rounded-lg bg-white dark:bg-[#1a2632] text-[#111418] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {aniosDisponibles.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Alertas */}
        {alertas && (alertas.criticos.length > 0 || alertas.advertencia.length > 0) && (
          <div className="mb-6 space-y-3">
            {alertas.criticos.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-red-600 dark:text-red-400 mr-2">
                    warning
                  </span>
                  <h3 className="font-bold text-red-800 dark:text-red-300">
                    Saldos Críticos ({alertas.criticos.length})
                  </h3>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {alertas.criticos.map((a: any) => a.estacion_nombre).join(', ')}
                </p>
              </div>
            )}
            
            {alertas.advertencia.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                <div className="flex items-center">
                  <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 mr-2">
                    info
                  </span>
                  <h3 className="font-bold text-yellow-800 dark:text-yellow-300">
                    Saldos Pendientes ({alertas.advertencia.length})
                  </h3>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  {alertas.advertencia.map((a: any) => a.estacion_nombre).join(', ')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Banners de estado de periodos */}
        {data.tipo === 'gerente_zona' && (estadoPeriodoOperativo?.esta_cerrado || estadoPeriodoContable?.esta_cerrado) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner de periodo operativo cerrado */}
            {estadoPeriodoOperativo?.esta_cerrado && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 dark:border-blue-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">lock</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      Periodo Operativo Cerrado
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      Este periodo operativo ya ha sido cerrado. No se pueden registrar nuevas entregas ni gastos de zona.
                      {estadoPeriodoOperativo.cerrado_por && (
                        <span className="block mt-1">
                          Cerrado por: <strong>{estadoPeriodoOperativo.cerrado_por}</strong>
                        </span>
                      )}
                      {estadoPeriodoOperativo.fecha_cierre && (
                        <span className="block">
                          Fecha: <strong>{new Date(estadoPeriodoOperativo.fecha_cierre).toLocaleString('es-MX')}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Banner de periodo contable cerrado */}
            {estadoPeriodoContable?.esta_cerrado && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 dark:border-purple-400 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-2xl">verified</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-1">
                      Periodo Contable Liquidado
                    </h3>
                    <p className="text-sm text-purple-800 dark:text-purple-400">
                      Este periodo contable ya ha sido liquidado. No se puede volver a liquidar.
                      {estadoPeriodoContable.cerrado_por && (
                        <span className="block mt-1">
                          Liquidado por: <strong>{estadoPeriodoContable.cerrado_por}</strong>
                        </span>
                      )}
                      {estadoPeriodoContable.fecha_cierre && (
                        <span className="block">
                          Fecha: <strong>{new Date(estadoPeriodoContable.fecha_cierre).toLocaleString('es-MX')}</strong>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="mb-6 flex justify-end gap-3">
          {/* Botones para Gerente de Estación */}
          {data.tipo === 'gerente_estacion' && estacionesParaGasto.length > 0 && (
            <button 
              onClick={() => setShowModalGasto(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              <span className="material-symbols-outlined mr-2 text-xl">receipt_long</span>
              Registrar Gasto
            </button>
          )}

          {/* Botones para Gerente de Zona */}
          {data.tipo === 'gerente_zona' && estacionesParaEntrega.length > 0 && (
            <>
              <button 
                onClick={() => setShowModalEntrega(true)}
                disabled={estadoPeriodoOperativo?.esta_cerrado}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md ${
                  estadoPeriodoOperativo?.esta_cerrado
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={estadoPeriodoOperativo?.esta_cerrado ? 'Periodo operativo cerrado' : 'Registrar entregas de estaciones'}
              >
                <span className="material-symbols-outlined mr-2 text-xl">payments</span>
                Registrar Entrega
              </button>
              <button 
                onClick={() => setShowModalGasto(true)}
                disabled={estadoPeriodoOperativo?.esta_cerrado}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md ${
                  estadoPeriodoOperativo?.esta_cerrado
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title={estadoPeriodoOperativo?.esta_cerrado ? 'Periodo operativo cerrado' : 'Registrar gastos de la zona'}
              >
                <span className="material-symbols-outlined mr-2 text-xl">receipt_long</span>
                Registrar Gasto Zona
              </button>
              <button 
                onClick={() => setShowModalLiquidar(true)}
                disabled={estadoPeriodoContable?.esta_cerrado}
                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md ${
                  estadoPeriodoContable?.esta_cerrado
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                title={estadoPeriodoContable?.esta_cerrado ? 'Periodo contable ya cerrado' : 'Cerrar período contable'}
              >
                <span className="material-symbols-outlined mr-2 text-xl">
                  {estadoPeriodoContable?.esta_cerrado ? 'lock' : 'check_circle'}
                </span>
                Liquidar Período
              </button>
            </>
          )}
        </div>

        {/* Contenido según el tipo */}
        {data.tipo === 'gerente_estacion' && <DashboardGerenteEstacion data={data.data} formatNumber={formatNumber} getEstadoSaldo={getEstadoSaldo} />}
        {data.tipo === 'gerente_zona' && <DashboardGerenteZona data={data.data} formatNumber={formatNumber} getEstadoSaldo={getEstadoSaldo} />}
        {(data.tipo === 'director' || data.tipo === 'admin') && <DashboardDirector data={data.data} formatNumber={formatNumber} />}
      </main>

      {/* Modal Registrar Gasto - Gerente de Estación */}
      {showModalGasto && estacionesParaGasto.length > 0 && data?.tipo === 'gerente_estacion' && (
        <ModalRegistrarGasto
          estaciones={estacionesParaGasto}
          onClose={() => setShowModalGasto(false)}
          periodo={periodo}
          tipo="estacion"
        />
      )}

      {/* Modal Registrar Gasto - Gerente de Zona */}
      {showModalGasto && data?.tipo === 'gerente_zona' && zonaId && (
        <ModalRegistrarGasto
          zona={{ id: zonaId, nombre: zonaNombre }}
          onClose={() => setShowModalGasto(false)}
          periodo={periodo}
          tipo="zona"
        />
      )}

      {/* Modal Registrar Entrega */}
      {showModalEntrega && estacionesParaEntrega.length > 0 && zonaId && (
        <ModalRegistrarEntrega
          estaciones={estacionesParaEntrega}
          zona_id={zonaId}
          zona_nombre={zonaNombre}
          onClose={() => setShowModalEntrega(false)}
          periodo={periodo}
        />
      )}

      {/* Modal Liquidar Período */}
      {showModalLiquidar && data?.tipo === 'gerente_zona' && data?.data && (
        <ModalLiquidarPeriodo
          estaciones={data.data.estaciones || []}
          zona_nombre={data.data.zona?.zona_nombre || zonaNombre}
          periodo={periodo}
          resguardo_zona={data.data.zona?.resguardo_actual || 0}
          saldo_pendiente={data.data.zona?.saldo_pendiente_estaciones || 0}
          onClose={() => setShowModalLiquidar(false)}
        />
      )}
    </div>
  );
}

// ===== Componentes para cada tipo de usuario (Sin cambios) =====

interface DashboardGerenteEstacionProps {
  data: any;
  formatNumber: (value: string | number) => string;
  getEstadoSaldo: (saldo: number, merma: number) => any;
}

function DashboardGerenteEstacion({ data, formatNumber, getEstadoSaldo }: DashboardGerenteEstacionProps) {
  // ... (código existente del componente DashboardGerenteEstacion)
  return (
    <div className="space-y-6">
      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#60758a] dark:text-gray-400">Merma Generada</span>
            <span className="material-symbols-outlined text-green-600 dark:text-green-400">trending_up</span>
          </div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.merma_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#60758a] dark:text-gray-400">Entregas Realizadas</span>
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">payments</span>
          </div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.entregas_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#60758a] dark:text-gray-400">Gastos Realizados</span>
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">receipt_long</span>
          </div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.gastos_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#60758a] dark:text-gray-400">En Resguardo</span>
            <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">account_balance_wallet</span>
          </div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.resguardo_total)}
          </div>
        </div>
      </div>

      {/* Tabla de estaciones */}
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Mis Estaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1b2a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Estación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Merma</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Entregas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Gastos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Saldo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
              {data.estaciones.map((estacion: any) => {
                const estado = getEstadoSaldo(
                  parseFloat(estacion.saldo_resguardo.toString()),
                  parseFloat(estacion.merma_generada.toString()),
                  parseFloat(estacion.entregas_realizadas.toString() || '0')
                );
                return (
                  <tr key={estacion.estacion_id} className="hover:bg-gray-50 dark:hover:bg-[#0d1b2a]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111418] dark:text-white">
                      {estacion.estacion_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.merma_generada)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.entregas_realizadas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.gastos_realizados)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#111418] dark:text-white">
                      ${formatNumber(estacion.saldo_resguardo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color}`}>
                        {estado.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface DashboardGerenteZonaProps {
  data: any;
  formatNumber: (value: string | number) => string;
  getEstadoSaldo: (saldo: number, merma: number) => any;
}

function DashboardGerenteZona({ data, formatNumber, getEstadoSaldo }: DashboardGerenteZonaProps) {
  // ... (código existente del componente DashboardGerenteZona)
  return (
    <div className="space-y-6">
      {/* Resumen de la zona */}
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">{data.zona.zona_nombre}</h2>
          <p className="text-sm text-[#60758a] dark:text-gray-400 mt-1">Resumen Financiero</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0d1b2a]">
              <div className="text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider mb-1">Saldo Inicial</div>
              <div className="text-2xl font-bold text-[#111418] dark:text-white">${formatNumber(data.zona.saldo_inicial)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0d1b2a]">
              <div className="text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider mb-1">Entregas Recibidas</div>
              <div className="text-2xl font-bold text-[#111418] dark:text-white">${formatNumber(data.zona.entregas_recibidas)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0d1b2a]">
              <div className="text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider mb-1">Entregas a Dirección</div>
              <div className="text-2xl font-bold text-[#111418] dark:text-white">${formatNumber(data.zona.entregas_direccion)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0d1b2a]">
              <div className="text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider mb-1">Gastos de Zona</div>
              <div className="text-2xl font-bold text-[#111418] dark:text-white">${formatNumber(data.zona.gastos_zona)}</div>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Resguardo en Zona</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">${formatNumber(data.zona.resguardo_actual)}</div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="text-xs font-medium text-yellow-700 dark:text-yellow-400 uppercase tracking-wider mb-1">Pendiente en Estaciones</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">${formatNumber(data.zona.saldo_pendiente_estaciones || 0)}</div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700">
            <p className="text-sm text-[#60758a] dark:text-gray-400">
              <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
              El <strong>Resguardo en Zona</strong> es el dinero que ya tienes. El <strong>Pendiente en Estaciones</strong> es el que aún debes recolectar.
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#60758a] dark:text-gray-400">Liquidadas</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {data.estadisticas.estaciones_liquidadas}
              </div>
            </div>
            <span className="material-symbols-outlined text-5xl text-green-600 dark:text-green-400">
              check_circle
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#60758a] dark:text-gray-400">En Proceso</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {data.estadisticas.estaciones_proceso}
              </div>
            </div>
            <span className="material-symbols-outlined text-5xl text-blue-600 dark:text-blue-400">
              schedule
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#60758a] dark:text-gray-400">Por Liquidar</div>
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {data.estadisticas.estaciones_pendientes}
              </div>
            </div>
            <span className="material-symbols-outlined text-5xl text-yellow-600 dark:text-yellow-400">
              pending
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#60758a] dark:text-gray-400">% Liquidación</div>
              <div className="text-3xl font-bold text-[#111418] dark:text-white">
                {data.estadisticas.porcentaje_liquidacion.toFixed(1)}%
              </div>
            </div>
            <span className="material-symbols-outlined text-5xl text-[#60758a] dark:text-gray-400">
              analytics
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de estaciones */}
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Estaciones de la Zona</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1b2a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Estación</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Merma</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Entregas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Gastos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Saldo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
              {data.estaciones.map((estacion: any) => {
                const estado = getEstadoSaldo(
                  parseFloat(estacion.saldo_resguardo.toString()),
                  parseFloat(estacion.merma_generada.toString()),
                  parseFloat(estacion.entregas_realizadas.toString() || '0')
                );
                return (
                  <tr key={estacion.estacion_id} className="hover:bg-gray-50 dark:hover:bg-[#0d1b2a]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111418] dark:text-white">
                      {estacion.estacion_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.merma_generada)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.entregas_realizadas)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                      ${formatNumber(estacion.gastos_realizados)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#111418] dark:text-white">
                      ${formatNumber(estacion.saldo_resguardo)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estado.bg} ${estado.color}`}>
                        {estado.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface DashboardDirectorProps {
  data: any;
  formatNumber: (value: string | number) => string;
}

function DashboardDirector({ data, formatNumber }: DashboardDirectorProps) {
  // ... (código existente del componente DashboardDirector)
  return (
    <div className="space-y-6">
      {/* Totales generales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="text-sm text-[#60758a] dark:text-gray-400 mb-2">Saldo Inicial</div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.saldo_inicial_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="text-sm text-[#60758a] dark:text-gray-400 mb-2">Entregas Recibidas</div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.entregas_recibidas_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="text-sm text-[#60758a] dark:text-gray-400 mb-2">Entregas a Dirección</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ${formatNumber(data.totales.entregas_direccion_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="text-sm text-[#60758a] dark:text-gray-400 mb-2">Gastos</div>
          <div className="text-2xl font-bold text-[#111418] dark:text-white">
            ${formatNumber(data.totales.gastos_total)}
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 p-6">
          <div className="text-sm text-[#60758a] dark:text-gray-400 mb-2">Resguardo Total</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            ${formatNumber(data.totales.resguardo_total)}
          </div>
        </div>
      </div>

      {/* Tabla por zona */}
      <div className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#e6e8eb] dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e6e8eb] dark:border-slate-700">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white">Resguardos por Zona</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0d1b2a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Zona</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Saldo Inicial</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Recibidas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">A Dirección</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Gastos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#60758a] dark:text-gray-400 uppercase tracking-wider">Resguardo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e8eb] dark:divide-slate-700">
              {data.zonas.map((zona: any) => (
                <tr key={zona.zona_id} className="hover:bg-gray-50 dark:hover:bg-[#0d1b2a]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#111418] dark:text-white">
                    {zona.zona_nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                    ${formatNumber(zona.saldo_inicial)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                    ${formatNumber(zona.entregas_recibidas)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-medium">
                    ${formatNumber(zona.entregas_direccion)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-[#111418] dark:text-white">
                    ${formatNumber(zona.gastos_zona)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                    ${formatNumber(zona.resguardo_actual)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
