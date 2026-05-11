import type { Request, Response } from 'express';
import type { AuthedRequest } from '../../middleware/auth.middleware.js';
/** QPay webhook (нийтэд) */
export declare function qpayCallback(req: Request, res: Response): Promise<void>;
export declare function createQpayForApplication(req: AuthedRequest, res: Response): Promise<void>;
/** Жагсаалтаас сонгосон хүлээгдэж буй төлбөр (аль хэдийн үүссэн Payment бичлэг) — QPay invoice шинэчилнэ */
export declare function createQpayForPendingPayment(req: AuthedRequest, res: Response): Promise<void>;
export declare function checkQpayPayment(req: AuthedRequest, res: Response): Promise<void>;
