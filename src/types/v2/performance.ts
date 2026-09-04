export type Granularity = 'departure' | 'week' | 'month' | 'quarter' | 'year'

export interface PerformanceSliceDto {
  sliceKey: string | null
  sliceLabel: string | null
  departureDate: string | null
  departureWeek: number | null
  departureMonth: number | null
  departureYear: number | null
  // CY actuals
  capacity: number
  unitsSold: number
  loadFactor: number
  grossRevenue: number
  grossYield: number
  netRevenue: number
  netYield: number
  margin: number
  paxTax: number
  totalCost: number
  // PY
  unitsSoldPY: number
  loadFactorPY: number
  grossRevenuePY: number
  grossYieldPY: number
  netRevenuePY: number
  marginPY: number
  // FC
  unitsSoldFC: number
  loadFactorFC: number
  grossRevenueFC: number
  grossYieldFC: number
  // Period comparisons
  unitsSoldPW: number
  grossRevenuePW: number
  unitsSoldPM: number
  grossRevenuePM: number
  unitsSoldPD: number
  // Ancillaries
  infantGrossRevenue: number
  luggageGrossRevenue: number
  penaltyGrossRevenue: number
  productCount: number
}

export interface PerformanceQuery {
  year: number
  month: number
  granularity?: Granularity
  marketIds?: string[]
  cabinCodes?: string[]
  origin?: string
  destination?: string
}
