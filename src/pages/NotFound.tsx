import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="font-display font-bold text-[48px] bg-gradient-to-br from-es-blue to-es-magenta bg-clip-text text-transparent">
          404
        </div>
        <h2 className="font-display font-semibold text-[20px] text-rm-dark mb-2">
          Pagina niet gevonden
        </h2>
        <p className="font-body text-sm text-rm-gray mb-5">
          Deze URL bestaat niet in RAM. Mogelijk is de link verouderd.
        </p>
        <Link
          to="/"
          className="inline-block font-display font-medium text-[13px] text-es-blue hover:underline"
        >
          ← Terug naar Home
        </Link>
      </div>
    </div>
  )
}
