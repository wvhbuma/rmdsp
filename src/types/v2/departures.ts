export interface DepartureDto {
  productId: number
  productGroupId: number | null
  productName: string | null
  origin: string | null
  destination: string | null
  cabinCode: string | null
  cabin: string | null
  segment: string | null
  departureDate: string | null
  dayOfWeek: number | null
  week: number | null
  productNumber: string | null
  referenceNr: string | null
  activeRBD: string | null
  maxPriority: number | null
  totalSold: number | null
  unitsSoldToday: number
  unitsSoldTodayPeriod1: number
  unitsSoldTodayPeriod2: number
  unitsSoldTodayPeriod3: number
  unitsSoldYesterday: number
  unitsSoldYesterdayPeriod1: number
  unitsSoldYesterdayPeriod2: number
  unitsSoldYesterdayPeriod3: number
  unitsSoldCW: number
  unitsSoldPW: number
  lastViewedByUser: string | null
  lastViewedUtc: string | null
  authorizationLastModifiedByUser: string | null
  authorizationLastModifiedUtc: string | null
}

export interface DepartureDetailDto {
  productId: number
  productGroupId: number | null
  referenceNr: string | null
  productNumber: string | null
  origin: string | null
  destination: string | null
  segment: string | null
  departureDate: string | null
  departureDayOfWeek: number | null
  departureYear: number | null
  cabinCode: string | null
  activeRBD: string | null
  previousProductId: number | null
  nextProductId: number | null
  // KPIs
  totalUnits: number | null
  totalUnitsSold: number | null
  loadFactor: number | null
  grossRevenue: number | null
  netRevenue: number | null
  grossYield: number | null
  netYield: number | null
  margin: number | null
  totalUnitsSoldPY: number | null
  loadFactorPY: number | null
  grossRevenuePY: number | null
  netRevenuePY: number | null
  grossYieldPY: number | null
  totalUnitsSoldFC: number | null
  loadFactorFC: number | null
  grossRevenueFC: number | null
  grossYieldFC: number | null
}

export interface BookingDto {
  bookingDate: string
  bookingTime: string
  cancellationDate: string | null
  status: number
  travellerStatus: number
  leadTimeDays: number
  paxType: string
  unitsSold: number
  rbd: string | null
  farePrice: number
  currencyCode: string
  paxTax: number
  fareConditionCode: string | null
  pnr: string | null
  passengerId: string | null
  salesSource: string | null
  agentName: string | null
  sharing: string | null
  modifiedUtc: string
}

export interface CockpitFareDto {
  rbd: string
  description: string | null
  unitPrice: number | null
  totalUnits: number | null
  unitsSold: number | null
  cumulativeUnitsSold: number | null
  totalUnitsPY: number | null
  unitsSoldPY: number | null
  cumulativeUnitsSoldPY: number | null
  newTotalUnits: number | null
  totalUnitsFC: number | null
  isActive: boolean
  sortIndex: number
}

export interface CostPriceDto {
  productId: number
  leadTimeDays: number
  value: number
  modifiedUtc: string
}

export interface PaxTaxDto {
  productId: number
  paxType: number
  leadTimeDays: number
  value: number
  modifiedUtc: string
}
