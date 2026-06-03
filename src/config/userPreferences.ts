/*
 * Types, defaults en presets voor de User Preferences (Feature Visibility,
 * Chart Preferences, Route Assignment). De waarden worden in localStorage
 * bewaard onder de keys hieronder; de hook useUserPreferences leest/schrijft ze.
 */
import { CATALOG_DIRECTIONS, CATALOG_MARKETS } from '@/config/routes'

export const STORAGE_KEYS = {
  features: 'ram_user_features',
  chartPrefs: 'ram_user_chart_prefs',
  routes: 'ram_user_routes',
} as const

/* ── Feature Visibility ─────────────────────────────────────────────────── */

/*
 * Map van route-pad → zichtbaar. Een ontbrekend pad geldt als zichtbaar
 * (default: alles aan). We slaan dus alleen expliciete keuzes op.
 */
export type FeatureVisibility = Record<string, boolean>

/* ── Chart Preferences ──────────────────────────────────────────────────── */

export type ChartType = 'bar' | 'line' | 'donut' | 'scatter' | 'heatmap'

export const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: 'bar', label: 'Bar' },
  { id: 'line', label: 'Line' },
  { id: 'donut', label: 'Donut' },
  { id: 'scatter', label: 'Scatter' },
  { id: 'heatmap', label: 'Heatmap' },
]

export type PaletteId = 'es-classic' | 'neutral' | 'accessible'

export interface Palette {
  id: PaletteId
  label: string
  /** Representatieve swatch-kleuren (voor de preview in de UI). */
  colors: string[]
}

export const PALETTES: Record<PaletteId, Palette> = {
  'es-classic': {
    id: 'es-classic',
    label: 'ES Classic',
    colors: ['#0077FF', '#C92EC9', '#0d9e4f', '#e07a00'],
  },
  neutral: {
    id: 'neutral',
    label: 'Neutral',
    colors: ['#1a1a2e', '#4b4b5e', '#6d6e71', '#a8a9ad'],
  },
  accessible: {
    id: 'accessible',
    // Okabe–Ito colorblind-safe palet.
    label: 'Accessible',
    colors: ['#0072B2', '#E69F00', '#009E73', '#CC79A7'],
  },
}

export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[]

export const DEFAULT_PALETTE: PaletteId = 'es-classic'

export type ChartPrefs = Record<ChartType, PaletteId>

export const DEFAULT_CHART_PREFS: ChartPrefs = {
  bar: DEFAULT_PALETTE,
  line: DEFAULT_PALETTE,
  donut: DEFAULT_PALETTE,
  scatter: DEFAULT_PALETTE,
  heatmap: DEFAULT_PALETTE,
}

/* ── Route Assignment ───────────────────────────────────────────────────── */

export interface RouteAssignment {
  /** Toegewezen markt-namen. */
  markets: string[]
  /** Toegewezen directionele codes. */
  directions: string[]
}

/** Default: alle routes uit de catalogus toegewezen. */
export const DEFAULT_ROUTE_ASSIGNMENT: RouteAssignment = {
  markets: [...CATALOG_MARKETS],
  directions: [...CATALOG_DIRECTIONS],
}
