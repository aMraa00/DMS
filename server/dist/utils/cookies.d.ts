import type { Response } from 'express';
export declare function setAuthCookies(res: Response, access: string, refresh: string): void;
export declare function clearAuthCookies(res: Response): void;
export declare const AUTH_COOKIES: {
    ACCESS_COOKIE: string;
    REFRESH_COOKIE: string;
};
