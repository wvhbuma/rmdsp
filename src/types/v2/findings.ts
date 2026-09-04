export type FindingAction = 'acted' | 'dismissed' | 'snoozed' | 'archived' | 'executed'
export type FindingSource = 'rule' | 'agent'

export interface NotificationDto {
  id: number
  source: FindingSource
  productId: number | null
  ruleId: number
  product: string | null
  rule: string | null
  origin: string | null
  destination: string | null
  departureDate: string | null   // DateOnly serializes as 'YYYY-MM-DD'
  productNumber: string | null
  cabin: string | null
  status: string
  priority: number
  priorityAsString: string | null
  description: string
  note: string
  tags: string | null
  actionNote: string | null
  createdUtc: string
  handledUtc: string | null
  snoozedUtc: string | null
  archivedUtc: string | null
  resetVisible: boolean
  snoozeVisible: boolean
  handleVisible: boolean
  archiveVisible: boolean
}

export interface RespondRequest {
  action: FindingAction
  note?: string
}
