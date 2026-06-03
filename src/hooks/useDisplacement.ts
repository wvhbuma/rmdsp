/*
 * TanStack Query-hook voor de displacement-dataset.
 *
 * De volledige dataset komt in één call binnen (summary + departures + od + legs
 * + dimensies). Filteren gebeurt client-side in de pagina's; dat houdt de
 * netwerk-laag simpel en de filter-interacties instant. Bij groei naar veel
 * markten kan dit later server-side, maar voor Fase 1 is dit ruim voldoende.
 *
 * staleTime hoog: de dataset verandert hooguit per dag, dus geen refetch bij
 * elke focus-change.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchDisplacement } from '@/api/displacement'
import type { DisplacementResponse } from '@/types/displacement'

export const DISPLACEMENT_QUERY_KEY = ['displacement'] as const

export function useDisplacement(): UseQueryResult<DisplacementResponse, Error> {
  return useQuery({
    queryKey: DISPLACEMENT_QUERY_KEY,
    queryFn: ({ signal }) => fetchDisplacement(signal),
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}
