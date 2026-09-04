/*
 * Badge voor het vraag-profiel van een target (High/Med/Low).
 * Kleuren komen overeen met PROFILE_COLORS (magenta/blue/gray = bestaande tokens).
 */
import type { ProfileName } from '@/types/seasonal'

const PROFILE_CLASS: Record<ProfileName, string> = {
  High: 'bg-es-magenta',
  Med: 'bg-es-blue',
  Low: 'bg-rm-gray',
}

export function ProfileBadge({ profile }: { profile: ProfileName }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 font-display text-[10px] font-medium text-white ${PROFILE_CLASS[profile]}`}
    >
      {profile}
    </span>
  )
}
