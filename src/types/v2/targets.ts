export interface TargetDto {
  productId: number
  referenceId: string | null
  cabinCode: string | null
  departureDate: string | null
  origin: string | null
  destination: string | null
  marketId: string
  // Targets
  targetCapacity: number | null
  targetUnitsSold: number | null
  targetGrossRevenue: number | null
  targetGrossYield: number | null
  targetPaxTax: number | null
  targetTotalCost: number | null
  targetMargin: number | null
  targetLoadFactor: number | null
  // Actuals (null when includeActuals=false)
  actualUnitsSold: number | null
  actualLoadFactor: number | null
  actualGrossRevenue: number | null
  actualGrossYield: number | null
  actualNetRevenue: number | null
  actualMargin: number | null
}

export interface TargetRouteSummaryDto {
  origin: string | null
  destination: string | null
  marketId: string | null
  productCount: number
  targetCapacity: number | null
  targetUnitsSold: number | null
  targetLoadFactor: number | null
  targetGrossRevenue: number | null
  targetGrossYield: number | null
  targetMargin: number | null
  targetTotalCost: number | null
  actualUnitsSold: number | null
  actualLoadFactor: number | null
  actualGrossRevenue: number | null
  actualGrossYield: number | null
}

export interface ImportTargetsRequest {
  items: ProductTargetImportLine[]
}

export interface ProductTargetImportLine {
  timeStampUtc: string
  productRefId: string
  cabinCode: string
  capacity?: number
  unitsSold?: number
  loadFactor?: number
  purchaseCost?: number   // maps to targetTotalCost on the server
  grossRevenue?: number
  paxTax?: number
  grossYield?: number
  margin?: number
}
