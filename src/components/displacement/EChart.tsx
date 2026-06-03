/*
 * ECharts-wrapper voor de displacement-pagina's.
 *
 * We registreren alleen de chart-types en componenten die we daadwerkelijk
 * gebruiken (tree-shaking — ECharts is ~700KB als je alles importeert). Zie
 * CLAUDE.md: importeer per chart-type via echarts/core.
 *
 * Gebruik: <EChart option={...} className="h-72" /> — de wrapper vult de hoogte
 * van zijn container, dus geef altijd een hoogte mee via className.
 */
import { useMemo } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
} from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption } from 'echarts/core'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  LabelLayout,
  CanvasRenderer,
])

type EChartProps = {
  option: EChartsCoreOption
  className?: string
}

export function EChart({ option, className }: EChartProps) {
  // style moet expliciet 100% zijn; echarts-for-react meet de container.
  const style = useMemo(() => ({ height: '100%', width: '100%' }), [])
  return (
    <div className={className}>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        notMerge
        lazyUpdate
        style={style}
      />
    </div>
  )
}
