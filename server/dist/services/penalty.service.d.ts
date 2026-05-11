/** Журмын 4.4 (гэрээ хийгээгүй → 10%), 4.5 (гэрээ цуц → 1 сар). Нөхцлүүд нь давхардвал эхэлж цуцлалтын дүрэм. */
export type PenaltyFlags = {
    /** Гэрээ цуцлагдсан */
    cancelled?: boolean;
    /** Анх гэрээ гарын үсэг үлдээгүй (10%) */
    neverSignedContract?: boolean;
};
export type PenaltyBreakdown = {
    appliedFee: number;
    basis: 'ten_percent_no_contract' | 'one_month_on_cancel' | 'none';
    notes: string[];
    discountApplied?: number;
};
export declare function computeRefundPenalties(principalAmount: number, monthlyRoomFeeHint: number | undefined, flags?: PenaltyFlags): PenaltyBreakdown;
/**
 * Оюутны зөвлөлийн гишүүний хөнгөлөлт тооцоолно.
 * CouncilMember.feeDiscount нь 0–50% хүртэл байж болно.
 * termEnd нь одоогоос хойш байвал хөнгөлөлт хүчинтэй.
 */
export declare function applyCouncilDiscount(amount: number, discountPct: number): {
    discounted: number;
    saved: number;
    discountPct: number;
};
