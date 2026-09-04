/*
 * Mock-findings voor offline/dev-weergave (VITE_DEV_NO_AUTH of API onbereikbaar).
 * Vorm = exact PagedResult<NotificationDto> uit RAM API v2. Zie src/api/v2/findings.ts
 * voor de dev-fallback die deze data filtert + pagineert.
 */
import type { NotificationDto } from '@/types/v2/findings'

export const MOCK_FINDINGS: NotificationDto[] = [
  {
    id: 4711, source: 'rule', productId: 9001, ruleId: 12,
    product: 'BEMI-PRA 2026-06-21', rule: 'Load Factor',
    origin: 'BEMI', destination: 'PRA', departureDate: '2026-06-21',
    productNumber: '453', cabin: 'Classic',
    status: 'New', priority: 4, priorityAsString: 'Critical',
    description: 'LF 12pp boven forecast bij 9 dagen voor vertrek; concurrent €24 duurder.',
    note: '', tags: 'capacity', actionNote: null,
    createdUtc: '2026-06-14T05:40:00Z', handledUtc: null, snoozedUtc: null, archivedUtc: null,
    resetVisible: false, snoozeVisible: true, handleVisible: true, archiveVisible: false,
  },
  {
    id: 4712, source: 'rule', productId: 9007, ruleId: 8,
    product: 'PNO-BLS 2026-06-24', rule: 'Competition',
    origin: 'PNO', destination: 'BLS', departureDate: '2026-06-24',
    productNumber: '511', cabin: 'Comfort Standard',
    status: 'New', priority: 3, priorityAsString: 'High',
    description: 'Concurrent ging gisteren €9 goedkoper; LF tracking 8pp onder forecast.',
    note: '', tags: 'pricing', actionNote: null,
    createdUtc: '2026-06-14T06:05:00Z', handledUtc: null, snoozedUtc: null, archivedUtc: null,
    resetVisible: false, snoozeVisible: true, handleVisible: true, archiveVisible: false,
  },
  {
    id: 4713, source: 'agent', productId: 9012, ruleId: 21,
    product: 'BEMI-MIL 2026-07-02', rule: 'Pacing Index',
    origin: 'BEMI', destination: 'MIL', departureDate: '2026-07-02',
    productNumber: '620', cabin: 'Comfort Plus',
    status: 'Snoozed by Esther', priority: 2, priorityAsString: 'Medium',
    description: 'Boekingstempo 1.8x vorig jaar; overweeg G-klasse te sluiten.',
    note: 'Na het weekend herbekijken.', tags: 'pace', actionNote: null,
    createdUtc: '2026-06-13T14:20:00Z', handledUtc: null,
    snoozedUtc: '2026-06-13T15:00:00Z', archivedUtc: null,
    resetVisible: true, snoozeVisible: false, handleVisible: true, archiveVisible: false,
  },
  {
    id: 4714, source: 'rule', productId: 9020, ruleId: 5,
    product: 'PRA-BEMI 2026-06-19', rule: 'Low Demand',
    origin: 'PRA', destination: 'BEMI', departureDate: '2026-06-19',
    productNumber: '454', cabin: 'Budget',
    status: 'Handled by Chris', priority: 1, priorityAsString: 'Low',
    description: 'LF 14pp onder forecast bij 5 dagen; G-klasse heropend.',
    note: 'AU verhoogd op G.', tags: 'demand', actionNote: null,
    createdUtc: '2026-06-12T09:10:00Z',
    handledUtc: '2026-06-12T11:30:00Z', snoozedUtc: null, archivedUtc: null,
    resetVisible: true, snoozeVisible: false, handleVisible: true, archiveVisible: true,
  },
  {
    id: 4715, source: 'rule', productId: 9033, ruleId: 8,
    product: 'BLS-PNO 2026-06-27', rule: 'Competition',
    origin: 'BLS', destination: 'PNO', departureDate: '2026-06-27',
    productNumber: '512', cabin: 'Classic',
    status: 'New', priority: 3, priorityAsString: 'High',
    description: 'Concurrent uitverkocht in Comfort; ruimte voor yield-verhoging.',
    note: '', tags: 'pricing', actionNote: null,
    createdUtc: '2026-06-14T07:15:00Z', handledUtc: null, snoozedUtc: null, archivedUtc: null,
    resetVisible: false, snoozeVisible: true, handleVisible: true, archiveVisible: false,
  },
  {
    id: 4716, source: 'agent', productId: 9041, ruleId: 12,
    product: 'BEMI-PRA 2026-07-05', rule: 'Load Factor',
    origin: 'BEMI', destination: 'PRA', departureDate: '2026-07-05',
    productNumber: '453', cabin: 'Comfort Standard',
    status: 'Archived by system', priority: 2, priorityAsString: 'Medium',
    description: 'LF genormaliseerd na AU-aanpassing; finding afgesloten.',
    note: '', tags: 'capacity', actionNote: null,
    createdUtc: '2026-06-10T08:00:00Z', handledUtc: '2026-06-10T10:00:00Z',
    snoozedUtc: null, archivedUtc: '2026-06-11T08:00:00Z',
    resetVisible: true, snoozeVisible: false, handleVisible: true, archiveVisible: false,
  },
]
