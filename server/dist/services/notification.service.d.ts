import mongoose from 'mongoose';
import type { Role } from '../types/roles.js';
export declare function createInAppNotification(userId: string | mongoose.Types.ObjectId, title: string, message: string, link?: string): Promise<void>;
export declare function notifyUsersWithRoles(roles: readonly Role[], title: string, message: string, link?: string): Promise<void>;
/** Идэвхтэй оюутнууд эсвэл бүх идэвхтэй хэрэглэгчид мэдэгдэл хуулагдана (чанкаар insert). */
export declare function broadcastInAppNotifications(opts: {
    title: string;
    message: string;
    link?: string;
    audience: 'students' | 'all';
}): Promise<{
    recipientCount: number;
}>;
/**
 * Гарын үсэг зурах хугацаа дуусах гэж байгаа гэрээнүүдэд мэдэгдэл илгээнэ.
 * Серверт эхлэхэд нэг удаа ажиллуулж, дараа нь цаг тутам шалгана.
 */
export declare function scheduleContractDeadlineReminders(): void;
/**
 * Идэвхтэй оюутанг жижүүрийн жагсаалтад синк үргэлжлүүлнэ.
 * Өдөр бүр (кампусын өдөр — Ховд/Жаргалант цагийн бүсээр тооцоолох, нэг удаа) тухайн өдрийн жижүүрийнд мэдэгдэл илгээнэ.
 */
export declare function scheduleDailyDutyReminders(): void;
