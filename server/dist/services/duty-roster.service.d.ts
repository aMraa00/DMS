import mongoose from 'mongoose';
/** Огнооны түлхүүр YYYY-MM-DD (кампусын CAMPUS_DAY_TIMEZONE-оор) */
export declare function dateKeyCampusDay(d?: Date): string;
/** Ээлж томилохдоо огнооны эхлэлийг кампусын өдөрт тааруулна */
export declare function dayOrdinalForRotation(dayKey: string): number;
type LeanUserBrief = {
    _id: mongoose.Types.ObjectId;
    status?: string;
    isDisabled?: boolean;
    firstName?: string;
    lastName?: string;
    studentId?: string;
};
/** Идэвхтэй оюутуудыг `sequence`-ийн дарааллаар буцаана */
export declare function getEligibleDutyRosterSorted(): Promise<{
    sequence: number;
    userId: LeanUserBrief;
}[]>;
export declare function dutyAssignedUserForDate(dayKey: string): Promise<{
    userIdStr: string;
    userBrief: {
        lastName?: string;
        firstName?: string;
        studentId?: string;
    };
} | null>;
/** Шинэ оюутан бүртгэлд очерть нэмэгдэнэ (байхгүй бол) */
export declare function appendStudentIfMissingToDutyRoster(userId: mongoose.Types.ObjectId | string): Promise<void>;
/** Одоо идэвхтэй бүх оюутанг жагсаалтад автоматаар нэгтгэнэ */
export declare function syncActiveStudentsOntoDutyRoster(): Promise<{
    added: number;
    rosterSize: number;
}>;
export declare function rosterAllEntriesForAdmin(): Promise<{
    _id: string;
    sequence: number;
    userId: string;
    userStatus?: string;
    firstName?: string;
    lastName?: string;
    studentId?: string;
    rosterEligibleDuty: boolean;
}[]>;
export declare function previewDutyWeekCampus(daysAhead: number): Promise<{
    dateKey: string;
    assignedUserId: string | null;
    nameHint: string;
}[]>;
type AdminDutyOpError = 'not_found' | 'not_student' | 'duplicate' | 'invalid_id' | 'invalid_body';
/** Админ: жагсаалтад шинэ оюутнаар томилно (давхардахгүй) */
export declare function adminAssignStudentToDutyRoster(userIdStr: string): Promise<{
    ok: true;
    entryId: string;
    sequence: number;
} | {
    ok: false;
    error: AdminDutyOpError;
}>;
/** Жижүүрийн ээлжээс админ томилголтыг авна */
export declare function adminRemoveDutyRosterEntry(entryIdStr: string): Promise<{
    ok: true;
} | {
    ok: false;
    error: AdminDutyOpError;
}>;
/** Дараалал 0 … n−1 болгож нэг стандарт руу буулгана */
export declare function adminNormalizeDutyRosterSequences(): Promise<void>;
/** Абсолют эрэмбэ: entryId-уудыг зөв эрэмбээр дамжууна */
export declare function adminSetDutyRosterOrder(entryIdsOrdered: string[]): Promise<{
    ok: true;
} | {
    ok: false;
    error: AdminDutyOpError;
}>;
/** Ойрын мөрүүдийг солиж ээлжийн дарааллыг солино */
export declare function adminSwapDutyRosterAdjacent(entryIdStr: string, direction: 'up' | 'down'): Promise<{
    ok: true;
} | {
    ok: false;
    error: AdminDutyOpError;
}>;
export {};
