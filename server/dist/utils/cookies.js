import { env } from '../config/env.js';
const ACCESS_COOKIE = 'dms_access';
const REFRESH_COOKIE = 'dms_refresh';
const cookieBase = () => ({
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
});
export function setAuthCookies(res, access, refresh) {
    res.cookie(ACCESS_COOKIE, access, {
        ...cookieBase(),
        maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE, refresh, {
        ...cookieBase(),
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
}
export function clearAuthCookies(res) {
    res.clearCookie(ACCESS_COOKIE, cookieBase());
    res.clearCookie(REFRESH_COOKIE, cookieBase());
}
export const AUTH_COOKIES = { ACCESS_COOKIE, REFRESH_COOKIE };
//# sourceMappingURL=cookies.js.map