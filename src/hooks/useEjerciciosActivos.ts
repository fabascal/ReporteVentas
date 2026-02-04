import { useQuery } from '@tanstack/react-query';
import ejerciciosService from '../services/ejerciciosService';

/**
 * Hook personalizado para obtener los ejercicios fiscales activos
 * Usado en todos los filtros de fecha del sistema
 */
export const useEjerciciosActivos = () => {
  const { data: ejerciciosData, isLoading, error } = useQuery({
    queryKey: ['ejercicios-activos'],
    queryFn: () => ejerciciosService.getActivos(),
    staleTime: 1000 * 60 * 30, // Cache por 30 minutos
    refetchOnWindowFocus: false,
  });

  // Asegurar que ejercicios es un array
  const ejercicios = ejerciciosData?.data || [];

  // Extraer solo los años para los selectores
  const aniosDisponibles = Array.isArray(ejercicios)
    ? ejercicios.map(e => e.anio).sort((a, b) => b - a)
    : [];

  // Verificar si un año específico está activo
  const isAnioActivo = (anio: number) => {
    return aniosDisponibles.includes(anio);
  };

  // Obtener el año más reciente activo (para valores por defecto)
  const anioMasReciente = aniosDisponibles.length > 0 ? aniosDisponibles[0] : new Date().getFullYear();

  return {
    ejercicios,
    aniosDisponibles,
    isLoading,
    error,
    isAnioActivo,
    anioMasReciente
  };
};
