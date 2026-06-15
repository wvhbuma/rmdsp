/*
 * Findings — RAM API v2 worklist-inbox (eerste v2-pagina, standaard-patroon).
 *
 * Filters in de URL (deelbaar): ?view=open|archived & ?status=... & ?page=N.
 * Data via useFindings (gepagineerd, filters in query-key); acties via de
 * optimistic useRespondToFinding-hook. Acties zijn flag-gestuurd: alleen wat
 * de finding's *Visible-velden toestaan wordt getoond.
 */
import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Archive, Check, Clock, RotateCcw } from 'lucide-react'
import type { FindingsQuery } from '@/api/v2/findings'
import { useFindings, useRespondToFinding } from '@/hooks/useFindings'
import type { FindingAction, NotificationDto } from '@/types/v2/findings'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState, ErrorState } from '@/components/ui/StateViews'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const PAGE_SIZE = 15

export function Findings() {
  const [params, setParams] = useSearchParams()

  const view = params.get('view') === 'archived' ? 'archived' : 'open'
  const status = params.get('status') ?? 'all'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const query: FindingsQuery = {
    archived: view === 'archived',
    page,
    pageSize: PAGE_SIZE,
    status: status === 'all' ? undefined : [status],
    sortBy: 'priority',
    sortDir: 'desc',
  }

  const findings = useFindings(query)
  const respond = useRespondToFinding(query)

  /** Eén filter wijzigen; bij een nieuwe filter resetten we naar pagina 1. */
  function setFilter(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value === null) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-xl text-rm-dark">Findings</h1>
          <p className="font-body text-sm text-rm-gray">
            Worklist van rule- en agent-bevindingen. Sorteer op prioriteit, handel af of snooze.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={view} onValueChange={(v) => setFilter('view', v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="archived">Gearchiveerd</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => setFilter('status', v === 'all' ? null : v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Alle statussen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statussen</SelectItem>
              <SelectItem value="new">Nieuw</SelectItem>
              <SelectItem value="snoozed">Gesnoozed</SelectItem>
              <SelectItem value="handled">Afgehandeld</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <SectionCard title="Findings" subtitle={findingsSubtitle(findings.data?.total)}>
        {findings.isError ? (
          <ErrorState title="Kon findings niet laden" message={findings.error.message} />
        ) : findings.isPending ? (
          <TableSkeleton />
        ) : findings.data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <FindingsTable
            items={findings.data.items}
            disabled={respond.isPending}
            onRespond={(id, action) => respond.mutate({ id, action })}
          />
        )}

        {findings.data && findings.data.total > 0 ? (
          <Pager
            page={findings.data.page}
            totalPages={findings.data.totalPages}
            hasPrevious={findings.data.hasPrevious}
            hasNext={findings.data.hasNext}
            onPage={(p) => setFilter('page', String(p))}
          />
        ) : null}
      </SectionCard>
    </div>
  )
}

function findingsSubtitle(total?: number): string {
  if (total === undefined) return 'Laden…'
  return total === 1 ? '1 finding' : `${total} findings`
}

/* ── Tabel ──────────────────────────────────────────────────────────────── */

function FindingsTable({
  items,
  disabled,
  onRespond,
}: {
  items: NotificationDto[]
  disabled: boolean
  onRespond: (id: number, action: FindingAction) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-rm-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prio</TableHead>
            <TableHead>Aangemaakt</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Vertrek</TableHead>
            <TableHead>Cabin</TableHead>
            <TableHead>Rule</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[260px]">Omschrijving</TableHead>
            <TableHead className="text-right">Acties</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((f) => (
            <TableRow key={f.id}>
              <TableCell><PriorityBadge finding={f} /></TableCell>
              <TableCell className="whitespace-nowrap text-rm-gray">{fmtDateTime(f.createdUtc)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium text-rm-dark">
                {f.origin && f.destination ? `${f.origin} → ${f.destination}` : '—'}
              </TableCell>
              <TableCell className="whitespace-nowrap text-rm-gray">{fmtDate(f.departureDate)}</TableCell>
              <TableCell className="whitespace-nowrap text-rm-gray">{f.cabin ?? '—'}</TableCell>
              <TableCell className="whitespace-nowrap text-rm-gray">{f.rule ?? '—'}</TableCell>
              <TableCell><StatusBadge status={f.status} /></TableCell>
              <TableCell className="text-rm-dark">{f.description}</TableCell>
              <TableCell>
                <RowActions finding={f} disabled={disabled} onRespond={onRespond} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Acties (flag-gestuurd) ─────────────────────────────────────────────── */

function RowActions({
  finding,
  disabled,
  onRespond,
}: {
  finding: NotificationDto
  disabled: boolean
  onRespond: (id: number, action: FindingAction) => void
}) {
  return (
    <div className="flex justify-end gap-1">
      {finding.handleVisible ? (
        <ActionButton label="Afhandelen" disabled={disabled} onClick={() => onRespond(finding.id, 'acted')}>
          <Check className="size-4" />
        </ActionButton>
      ) : null}
      {finding.snoozeVisible ? (
        <ActionButton label="Snooze" disabled={disabled} onClick={() => onRespond(finding.id, 'snoozed')}>
          <Clock className="size-4" />
        </ActionButton>
      ) : null}
      {finding.archiveVisible ? (
        <ActionButton label="Archiveren" disabled={disabled} onClick={() => onRespond(finding.id, 'archived')}>
          <Archive className="size-4" />
        </ActionButton>
      ) : null}
      {finding.resetVisible ? (
        <ActionButton label="Reset" disabled={disabled} onClick={() => onRespond(finding.id, 'dismissed')}>
          <RotateCcw className="size-4" />
        </ActionButton>
      ) : null}
    </div>
  )
}

function ActionButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  // Native title i.p.v. Radix Tooltip: shadcn 4.x Button heeft geen forwardRef,
  // dus <TooltipTrigger asChild><Button> faalt op React 18 (ref → null). Zie rapport.
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}

/* ── Badges ─────────────────────────────────────────────────────────────── */

function PriorityBadge({ finding }: { finding: NotificationDto }) {
  const label = finding.priorityAsString ?? String(finding.priority)
  const variant = finding.priority >= 4 ? 'destructive' : finding.priority >= 2 ? 'default' : 'secondary'
  return <Badge variant={variant}>{label}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const variant = s.startsWith('new') ? 'default' : s.startsWith('archived') ? 'outline' : 'secondary'
  return <Badge variant={variant} className="whitespace-nowrap">{status}</Badge>
}

/* ── Pager ──────────────────────────────────────────────────────────────── */

function Pager({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  onPage,
}: {
  page: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPage: (p: number) => void
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="font-body text-sm text-rm-gray">
        Pagina {page} van {Math.max(1, totalPages)}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrevious} onClick={() => onPage(page - 1)}>
          Vorige
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => onPage(page + 1)}>
          Volgende
        </Button>
      </div>
    </div>
  )
}

/* ── Loading skeleton ───────────────────────────────────────────────────── */

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

/* ── Date-helpers ───────────────────────────────────────────────────────── */

function fmtDateTime(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM HH:mm')
  } catch {
    return iso
  }
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'dd MMM yyyy')
  } catch {
    return iso
  }
}
