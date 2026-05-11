import type { NextFunction, Request, Response } from 'express';
export declare function notFound(req: Request, res: Response): void;
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void;
