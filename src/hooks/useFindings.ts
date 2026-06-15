/*
 * TanStack Query-hooks voor RAM API v2 findings (standaard v2-patroon, zie
 * CLAUDE.md). Filters zitten in de query-key (voorspelbaar + invalidatie-veilig).
 * useRespondToFinding doet een optimistic update: de finding verdwijnt direct
 * uit de huidige weergave, met rollback + toast bij fout.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { listFindings, respondToFinding, type FindingsQuery } from '@/api/v2/findings'
import type { PagedResult } from '@/types/api'
import type { FindingAction, NotificationDto } from '@/types/v2/findings'

export const findingsKeys = {
  all: ['v2', 'findings'] as const,
  list: (q: FindingsQuery) => ['v2', 'findings', 'list', q] as const,
}

export function useFindings(
  q: FindingsQuery,
): UseQueryResult<PagedResult<NotificationDto>, Error> {
  return useQuery({
    queryKey: findingsKeys.list(q),
    queryFn: ({ signal }) => listFindings(q, signal),
    placeholderData: keepPreviousData, // smooth paging/filteren: vorige pagina blijft staan
    staleTime: 30_000,
  })
}

export interface RespondVars {
  id: number
  action: FindingAction
  note?: string
}

interface RespondContext {
  previous?: PagedResult<NotificationDto>
}

export function useRespondToFinding(
  q: FindingsQuery,
): UseMutationResult<{ id: number; action: string }, Error, RespondVars, RespondContext> {
  const queryClient = useQueryClient()
  const key = findingsKeys.list(q)

  return useMutation({
    mutationFn: ({ id, action, note }: RespondVars) =>
      respondToFinding(id, { action, note }),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<PagedResult<NotificationDto>>(key)
      if (previous) {
        // Optimistisch: een beantwoorde finding verlaat de huidige (gefilterde) weergave.
        queryClient.setQueryData<PagedResult<NotificationDto>>(key, {
          ...previous,
          items: previous.items.filter((f) => f.id !== id),
          total: Math.max(0, previous.total - 1),
        })
      }
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
      toast.error('Actie mislukt — opnieuw geprobeerd?')
    },
    onSuccess: (_data, vars) => {
      toast.success(`Finding ${vars.action}`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: findingsKeys.all })
    },
  })
}
