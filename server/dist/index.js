import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDb } from './db/connect.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';
import { adminRouter } from './routes/v1/admin.routes.js';
import { authRouter } from './routes/v1/auth.routes.js';
import { applicationRouter } from './routes/v1/application.routes.js';
import { roomRouter } from './routes/v1/room.routes.js';
import { dailyRouter } from './routes/v1/daily.routes.js';
import { contractRouter } from './routes/v1/contract.routes.js';
import { paymentStudentRouter } from './routes/v1/payment-student.routes.js';
import { reportRouter } from './routes/v1/report.routes.js';
import { notificationsRouter } from './routes/v1/notifications.routes.js';
import { inventoryRouter } from './routes/v1/inventory.routes.js';
import { bookingRouter } from './routes/v1/booking.routes.js';
import { bulletinRouter } from './routes/v1/bulletin.routes.js';
import { scheduleContractDeadlineReminders, scheduleDailyDutyReminders } from './services/notification.service.js';
import { syncActiveStudentsOntoDutyRoster } from './services/duty-roster.service.js';
/** Хялбар in-memory rate limiter — general API (нэвтрэлтийг auth.routes дээр буруу оролдогоор тусдаа) */
function createRateLimiter(opts) {
    const hits = new Map();
    return (req, res, next) => {
        const ip = String(req.ip ?? req.socket?.remoteAddress ?? 'unknown');
        const now = Date.now();
        let entry = hits.get(ip);
        if (!entry || now > entry.resetAt) {
            entry = { count: 0, resetAt: now + opts.windowMs };
            hits.set(ip, entry);
        }
        entry.count++;
        if (entry.count > opts.max) {
            res.status(429).json({ error: opts.message });
            return;
        }
        next();
    };
}
const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 300,
    message: 'API хэт ачаалалтай. Хэсэг хүлээгээд дахин оролдоно уу.',
});
const app = express();
const uploadsRoot = path.join(process.cwd(), 'uploads');
try {
    fs.mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
}
catch {
    /* noop */
}
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
}));
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadsRoot));
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'dms-api' });
});
const v1 = express.Router();
v1.use('/auth', authRouter);
v1.use('/applications', apiLimiter, applicationRouter);
v1.use('/rooms', apiLimiter, roomRouter);
v1.use('/daily', apiLimiter, dailyRouter);
v1.use('/contracts', apiLimiter, contractRouter);
v1.use('/payments', apiLimiter, paymentStudentRouter);
v1.use('/reports', apiLimiter, reportRouter);
v1.use('/notifications', apiLimiter, notificationsRouter);
v1.use('/admin', apiLimiter, adminRouter);
v1.use('/inventory', apiLimiter, inventoryRouter);
v1.use('/bookings', apiLimiter, bookingRouter);
v1.use('/bulletins', apiLimiter, bulletinRouter);
app.use('/api/v1', v1);
app.use(notFound);
app.use(errorHandler);
await connectDb();
try {
    const r = await syncActiveStudentsOntoDutyRoster();
    // eslint-disable-next-line no-console -- startup
    if (r.added > 0)
        console.log(`Duty roster: +${r.added} студент синклоно (${r.rosterSize} нийт бичлэг)`);
}
catch {
    /* DB бэлэн болоогүй тохиолдол унахгүй */
}
scheduleContractDeadlineReminders();
scheduleDailyDutyReminders();
app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console -- startup log
    console.log(`DMS API listening on http://localhost:${env.PORT}`);
});
//# sourceMappingURL=index.js.map