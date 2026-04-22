import { Icon } from '@/layout/icons'

type ComingSoonProps = {
  feature: string
}

export function ComingSoon({ feature }: ComingSoonProps) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-rm-gray-light flex items-center justify-center text-rm-gray">
          <Icon name="clock" className="w-7 h-7" />
        </div>
        <h2 className="font-display font-semibold text-[20px] text-rm-dark mb-2">
          {feature}
        </h2>
        <p className="font-body text-sm text-rm-gray">
          Deze pagina komt in een volgende fase. De routing en layout staan —
          de inhoud volgt.
        </p>
      </div>
    </div>
  )
}
