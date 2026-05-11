import type { IUser } from '../models/User.model.js'

/**
 * Tier 1 = highest priority. Uses profile heuristics; tune with registrar rules.
 */
export function computePriorityTier(user: Pick<IUser, 'isDisabled' | 'region' | 'level'>): number {
  const levelRaw = (user.level || '').toLowerCase()
  const regionRaw = (user.region || '').toLowerCase()

  const isGradOrAdvanced =
    /\b(doctor|phd|mast|msc|MBA|давтан|эрдмийн|ахисан)\b/i.test(levelRaw + regionRaw)

  const isUbRemote =
    regionRaw.includes('багахангай') ||
    regionRaw.includes('нарантуул') ||
    regionRaw.includes('алслагдсан')

  const countryside =
    regionRaw.includes('хөдөө') ||
    regionRaw.includes('орон нутаг') ||
    regionRaw.includes('аймаг') ||
    regionRaw.includes('сум')

  const lvlMatch = levelRaw.match(/(\d)/)
  const lvlNum = lvlMatch ? Number(lvlMatch[1]) : NaN

  if (user.isDisabled || (countryside && lvlNum === 1)) return 1
  if (countryside && lvlNum >= 2 && lvlNum <= 3) return 2
  if (countryside && lvlNum >= 4 && lvlNum <= 5) return 3
  if (isUbRemote) return 4
  if (isGradOrAdvanced) return 5

  /** default mid queue */
  return 3
}

export function priorityWindowEnds(submittedAt: Date) {
  const end = new Date(submittedAt)
  end.setHours(end.getHours() + 24)
  return end
}
