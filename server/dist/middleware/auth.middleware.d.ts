import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../types/roles.js';
export type AuthedRequest = Request & {
    user?: {
        id: string;
        role: Role;
    };
};
/** Access token байвал `req.user` тохируулна; алдаа үед 401 биш, шууд `next()`. */
export declare function optionalAccessToken(req: AuthedRequest, _res: Response, next: NextFunction): void;
export declare function authenticate(req: AuthedRequest, res: Response, next: NextFunction): void;
export declare function requireRoles(...allowed: Role[]): (req: AuthedRequest, res: Response, next: NextFunction) => void;
