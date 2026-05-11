/** Журмын 4.4 (гэрээ хийгээгүй → 10%), 4.5 (гэрээ цуц → 1 сар). Нөхцлүүд нь давхардвал эхэлж цуцлалтын дүрэм. */

export type PenaltyFlags = {
  /** Гэрээ цуцлагдсан */
  cancelled?: boolean
  /** Анх гэрээ гарын үсэг үлдээгүй (10%) */
  neverSignedContract?: boolean
}

export type PenaltyBreakdown = {
  appliedFee: number
  basis: 'ten_percent_no_contract' | 'one_month_on_cancel' | 'none'
  notes: string[]
  discountApplied?: number
}

export function computeRefundPenalties(
  principalAmount: number,
  monthlyRoomFeeHint: number | undefined,
  flags?: PenaltyFlags,
): PenaltyBreakdown {
  const notes: string[] = []

  if (flags?.cancelled === true) {
    const base = monthlyRoomFeeHint ?? principalAmount / 12
    const appliedFee = Math.round(base * 100) / 100
    notes.push('Журмын 4.5: гэрээ цуцласан — 1 сарын суутгал (ойролцоолол)')
    return { appliedFee, basis: 'one_month_on_cancel', notes }
  }

  if (flags?.neverSignedContract === true) {
    const appliedFee = Math.round(principalAmount * 0.1 * 100) / 100
    notes.push('Журмын 4.4: гэрээ хийгээгүй — 10% шимтгэл')
    return { appliedFee, basis: 'ten_percent_no_contract', notes }
  }

  notes.push('Энэ хүсэлтэд шимтгэлийн тулгуур нөхцөл оруулаагүй; нягтлан шинжилнэ.')
  return { appliedFee: 0, basis: 'none', notes }
}

/**
 * Оюутны зөвлөлийн гишүүний хөнгөлөлт тооцоолно.
 * CouncilMember.feeDiscount нь 0–50% хүртэл байж болно.
 * termEnd нь одоогоос хойш байвал хөнгөлөлт хүчинтэй.
 */
export function applyCouncilDiscount(
  amount: number,
  discountPct: number,
): { discounted: number; saved: number; discountPct: number } {
  const pct = Math.min(50, Math.max(0, discountPct))
  const saved = Math.round(amount * (pct / 100) * 100) / 100
  const discounted = Math.round((amount - saved) * 100) / 100
  return { discounted, saved, discountPct: pct }
}
