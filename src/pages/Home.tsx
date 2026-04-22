import { Icon } from '@/layout/icons'
import { SystemStatus } from '@/components/SystemStatus'

export function Home() {
  return (
    <div className="p-8">
      <section className="max-w-3xl mx-auto text-center pt-16 pb-8">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-es-blue to-es-magenta flex items-center justify-center text-white shadow-sm">
          <Icon name="clock" className="w-8 h-8" />
        </div>
        <h1 className="font-display font-semibold text-2xl text-rm-dark mb-3">
          European Sleeper Performance
        </h1>
        <p className="font-body text-sm text-rm-gray leading-relaxed max-w-xl mx-auto">
          Revenue Automation &amp; Management — het RAM-dashboard voor
          European Sleeper. Gebruik de navigatie links om naar een module te
          gaan.
        </p>
      </section>

      <section className="max-w-3xl mx-auto">
        <SystemStatus />
      </section>
    </div>
  )
}
