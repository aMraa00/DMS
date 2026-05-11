export const ROLES = ['student', 'staff', 'admin', 'accountant'] as const
export type Role = (typeof ROLES)[number]
