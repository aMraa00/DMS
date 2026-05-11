/**
 * Кампусын байршил (харуулалт) — Ховд аймаг, Жаргалант.
 * Жижүүр/зочны «өдөр»-ийн тоо хэмжээнд CAMPUS_DAY_TIMEZONE (энв) ашиглана.
 */
export const CAMPUS_AIMAG_LABEL = 'Ховд';
export const CAMPUS_LOCALITY_LABEL = 'Жаргалант';
/** IANA цагийн бүс — жижүүрийн өдөр, сануулга, зочны цагийн дүрэм */
export function campusDayTimeZone() {
    const t = process.env.CAMPUS_DAY_TIMEZONE?.trim();
    return t && t.length > 0 ? t : 'Asia/Ulaanbaatar';
}
//# sourceMappingURL=campus-region.js.map