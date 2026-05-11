import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env.js';
export function signAccessToken(userId, role) {
    const payload = { sub: userId, role, type: 'access' };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES,
    });
}
export function signRefreshToken(userId, role) {
    const jti = uuidv4();
    const payload = { sub: userId, role, type: 'refresh', jti };
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES,
    });
    return { token, jti };
}
export function verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map