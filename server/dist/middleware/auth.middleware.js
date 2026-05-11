import { verifyAccessToken } from '../utils/jwt.js';
import { AUTH_COOKIES } from '../utils/cookies.js';
/** Access token байвал `req.user` тохируулна; алдаа үед 401 биш, шууд `next()`. */
export function optionalAccessToken(req, _res, next) {
    const token = req.cookies?.[AUTH_COOKIES.ACCESS_COOKIE];
    if (token) {
        try {
            const payload = verifyAccessToken(token);
            req.user = { id: payload.sub, role: payload.role };
        }
        catch {
            /* дууссан / буруу token */
        }
    }
    next();
}
export function authenticate(req, res, next) {
    const token = req.cookies?.[AUTH_COOKIES.ACCESS_COOKIE];
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    }
    catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
export function requireRoles(...allowed) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        if (!allowed.includes(req.user.role)) {
            res.status(403).json({ error: 'Forbidden' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map