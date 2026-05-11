/** Мөнгөн дүнг МУИС DMS прототойпын хэв маягт ойртуулсан формат */
export function formatMnt(amount: number) {
  return `₮ ${amount.toLocaleString('mn-MN')}`
}
