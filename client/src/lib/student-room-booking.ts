/** Өрөө сонгосон / төлбөр эсвэл гэрээний шатанд орсон захиалга */
export const STUDENT_ROOM_BOOKED_APPLICATION_STATUSES = [
  'room_selected',
  'payment_pending',
  'paid',
  'contract_pending',
  'completed',
] as const

export function studentHasConfirmedRoomBooking(
  applications: { status: string }[] | undefined,
): boolean {
  if (!applications?.length) return false
  const booked = new Set<string>(STUDENT_ROOM_BOOKED_APPLICATION_STATUSES)
  return applications.some((a) => booked.has(a.status))
}
