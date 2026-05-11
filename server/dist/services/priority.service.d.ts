import type { IUser } from '../models/User.model.js';
/**
 * Tier 1 = highest priority. Uses profile heuristics; tune with registrar rules.
 */
export declare function computePriorityTier(user: Pick<IUser, 'isDisabled' | 'region' | 'level'>): number;
export declare function priorityWindowEnds(submittedAt: Date): Date;
