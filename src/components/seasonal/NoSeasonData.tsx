/*
 * Consistente "geen data" staat voor alle seasonal-pagina's die op
 * useSeasonalResults() draaien: korte uitleg + link naar New Season.
 */
import { Link } from 'react-router-dom'

export function NoSeasonData({
  message = 'No season data available.',
}: {
  message?: string
}) {
  return (
    <div className="py-16 text-center font-body text-sm text-rm-gray">
      <p>{message}</p>
      <Link
        to="/season/new"
        className="mt-1 inline-block font-display font-medium text-es-blue hover:underline"
      >
        Create a season first →
      </Link>
    </div>
  )
}
