import { Icon } from '@/layout/icons'

export function Home() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto text-center pt-12">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-es-blue to-es-magenta flex items-center justify-center text-white">
          <Icon name="clock" className="w-8 h-8" />
        </div>
        <h1 className="font-display font-semibold text-2xl text-rm-dark mb-3">
          European Sleeper Performance
        </h1>
        <p className="font-body text-sm text-rm-gray">
          Revenue Automation &amp; Management — het RAM-dashboard voor
          European Sleeper. Gebruik de navigatie links om naar een module te
          gaan.
        </p>
      </div>
    </div>
  )
}
