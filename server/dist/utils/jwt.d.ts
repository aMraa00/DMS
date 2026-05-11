import type { Role } from '../types/roles.js';
export interface AccessPayload {
    sub: string;
    role: Role;
    type: 'access';
}
export interface RefreshPayload {
    sub: string;
    role: Role;
    type: 'refresh';
    jti: string;
}
export declare function signAccessToken(userId: string, role: Role): string;
export declare function signRefreshToken(userId: string, role: Role): {
    token: string;
    jti: string;
};
export declare function verifyAccessToken(token: string): AccessPayload;
export declare function verifyRefreshToken(token: string): RefreshPayload;
