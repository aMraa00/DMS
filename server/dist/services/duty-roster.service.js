import mongoose from 'mongoose';
import { campusDayTimeZone } from '../config/campus-region.js';
import { User } from '../models/User.model.js';
import { DutyRosterEntry } from '../models/DutyRosterEntry.model.js';
/** Огнооны түлхүүр YYYY-MM-DD (кампусын CAMPUS_DAY_TIMEZONE-оор) */
export function dateKeyCampusDay(d = new Date()) {
    return d.toLocaleDateString('en-CA', { timeZone: campusDayTimeZone() });
}
/** Ээлж томилохдоо огнооны эхлэлийг кампусын өдөрт тааруулна */
export function dayOrdinalForRotation(dayKey) {
    const [y, m, dd] = dayKey.split('-').map(Number);
    const t = Date.UTC(y, m - 1, dd, 12, 0, 0);
    return Math.floor(t / 86_400_000);
}
/** Идэвхтэй оюутуудыг `sequence`-ийн дарааллаар буцаана */
export async function getEligibleDutyRosterSorted() {
    const rows = await DutyRosterEntry.find()
        .sort({ sequence: 1 })
        .populate('userId', 'status isDisabled firstName lastName studentId')
        .lean();
    const out = [];
    for (const row of rows) {
        const u = row.userId;
        if (!u || u instanceof mongoose.Types.ObjectId)
            continue;
        if (u.status !== 'active')
            continue;
        if (u.isDisabled === true)
            continue;
        out.push({ sequence: row.sequence, userId: u });
    }
    return out;
}
export async function dutyAssignedUserForDate(dayKey) {
    const roster = await getEligibleDutyRosterSorted();
    if (!roster.length)
        return null;
    const ordinal = dayOrdinalForRotation(dayKey);
    const idx = ((ordinal % roster.length) + roster.length) % roster.length;
    const pick = roster[idx];
    return {
        userIdStr: String(pick.userId._id),
        userBrief: {
            lastName: pick.userId.lastName,
            firstName: pick.userId.firstName,
            studentId: pick.userId.studentId,
        },
    };
}
/** Шинэ оюутан бүртгэлд очерть нэмэгдэнэ (байхгүй бол) */
export async function appendStudentIfMissingToDutyRoster(userId) {
    const oid = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
    const dup = await DutyRosterEntry.findOne({ userId: oid });
    if (dup)
        return;
    const last = await DutyRosterEntry.findOne().sort({ sequence: -1 }).select('sequence').lean();
    const seq = last ? last.sequence + 1 : 0;
    await DutyRosterEntry.create({ userId: oid, sequence: seq });
}
/** Одоо идэвхтэй бүх оюутанг жагсаалтад автоматаар нэгтгэнэ */
export async function syncActiveStudentsOntoDutyRoster() {
    const students = await User.find({
        role: 'student',
        status: 'active',
        isDisabled: { $ne: true },
    })
        .sort({ createdAt: 1 })
        .select('_id')
        .lean();
    let added = 0;
    for (const s of students) {
        const ex = await DutyRosterEntry.findOne({ userId: s._id });
        if (!ex) {
            await appendStudentIfMissingToDutyRoster(s._id);
            added++;
        }
    }
    const rosterSize = await DutyRosterEntry.countDocuments();
    return { added, rosterSize };
}
export async function rosterAllEntriesForAdmin() {
    const rows = await DutyRosterEntry.find()
        .sort({ sequence: 1, _id: 1 })
        .populate('userId', 'status isDisabled firstName lastName studentId')
        .lean();
    return rows.map((row) => {
        const u = row.userId;
        let userIdStr = String(row.userId);
        let userStatus;
        let firstName;
        let lastName;
        let studentId;
        let rosterEligibleDuty = false;
        if (u && !(u instanceof mongoose.Types.ObjectId) && typeof u === 'object' && '_id' in u) {
            userIdStr = String(u._id);
            userStatus = u.status;
            firstName = u.firstName;
            lastName = u.lastName;
            studentId = u.studentId != null ? String(u.studentId) : undefined;
            rosterEligibleDuty = u.status === 'active' && u.isDisabled !== true;
        }
        return {
            _id: String(row._id),
            sequence: row.sequence,
            userId: userIdStr,
            userStatus,
            firstName,
            lastName,
            studentId,
            rosterEligibleDuty,
        };
    });
}
export async function previewDutyWeekCampus(daysAhead) {
    const n = Math.min(Math.max(daysAhead, 1), 42);
    const startKey = dateKeyCampusDay();
    const roster = await getEligibleDutyRosterSorted();
    const rosterLen = roster.length;
    const out = [];
    const baseOrdinal = dayOrdinalForRotation(startKey);
    function addDays(dayKey, deltaDays) {
        const [y0, mo0, d0] = dayKey.split('-').map(Number);
        const t = Date.UTC(y0, mo0 - 1, d0, 12, 0, 0);
        const t2 = new Date(t + deltaDays * 86_400_000);
        return t2.toLocaleDateString('en-CA', { timeZone: campusDayTimeZone() });
    }
    for (let i = 0; i < n; i++) {
        const dateKey = i === 0 ? startKey : addDays(startKey, i);
        const ord = baseOrdinal + i;
        let assignedUserId = null;
        let nameHint = '—';
        if (rosterLen > 0) {
            const idx = ((ord % rosterLen) + rosterLen) % rosterLen;
            const pick = roster[idx];
            assignedUserId = String(pick.userId._id);
            nameHint = `${pick.userId.lastName ?? ''} ${pick.userId.firstName ?? ''}`.trim();
            const sid = pick.userId.studentId?.trim();
            if (sid)
                nameHint = nameHint ? `${nameHint} · ${sid}` : sid;
        }
        out.push({ dateKey, assignedUserId, nameHint });
    }
    return out;
}
/** Админ: жагсаалтад шинэ оюутнаар томилно (давхардахгүй) */
export async function adminAssignStudentToDutyRoster(userIdStr) {
    if (!mongoose.isValidObjectId(userIdStr))
        return { ok: false, error: 'invalid_id' };
    const oid = new mongoose.Types.ObjectId(userIdStr);
    const u = await User.findById(oid).select('role').lean();
    if (!u)
        return { ok: false, error: 'not_found' };
    if (u.role !== 'student')
        return { ok: false, error: 'not_student' };
    const dup = await DutyRosterEntry.findOne({ userId: oid }).select('_id').lean();
    if (dup)
        return { ok: false, error: 'duplicate' };
    const last = await DutyRosterEntry.findOne().sort({ sequence: -1 }).select('sequence').lean();
    const seq = last ? last.sequence + 1 : 0;
    const doc = await DutyRosterEntry.create({ userId: oid, sequence: seq });
    return { ok: true, entryId: String(doc._id), sequence: doc.sequence };
}
/** Жижүүрийн ээлжээс админ томилголтыг авна */
export async function adminRemoveDutyRosterEntry(entryIdStr) {
    if (!mongoose.isValidObjectId(entryIdStr))
        return { ok: false, error: 'invalid_id' };
    const del = await DutyRosterEntry.findByIdAndDelete(entryIdStr);
    if (!del)
        return { ok: false, error: 'not_found' };
    await adminNormalizeDutyRosterSequences();
    return { ok: true };
}
/** Дараалал 0 … n−1 болгож нэг стандарт руу буулгана */
export async function adminNormalizeDutyRosterSequences() {
    const rows = await DutyRosterEntry.find().sort({ sequence: 1, _id: 1 }).select('_id').lean();
    if (!rows.length)
        return;
    const ops = rows.map((row, i) => ({
        updateOne: {
            filter: { _id: row._id },
            update: { $set: { sequence: i } },
        },
    }));
    await DutyRosterEntry.bulkWrite(ops);
}
/** Абсолют эрэмбэ: entryId-уудыг зөв эрэмбээр дамжууна */
export async function adminSetDutyRosterOrder(entryIdsOrdered) {
    if (!entryIdsOrdered.length)
        return { ok: false, error: 'invalid_body' };
    for (const id of entryIdsOrdered) {
        if (!mongoose.isValidObjectId(id))
            return { ok: false, error: 'invalid_id' };
    }
    const unique = new Set(entryIdsOrdered);
    if (unique.size !== entryIdsOrdered.length)
        return { ok: false, error: 'invalid_body' };
    const docs = await DutyRosterEntry.find({}).select('_id').lean();
    if (docs.length !== entryIdsOrdered.length)
        return { ok: false, error: 'invalid_body' };
    const have = new Set(docs.map((d) => String(d._id)));
    for (const id of entryIdsOrdered) {
        if (!have.has(id))
            return { ok: false, error: 'invalid_body' };
    }
    await DutyRosterEntry.bulkWrite(entryIdsOrdered.map((entryIdStr, seq) => ({
        updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(entryIdStr) },
            update: { $set: { sequence: seq } },
        },
    })));
    return { ok: true };
}
/** Ойрын мөрүүдийг солиж ээлжийн дарааллыг солино */
export async function adminSwapDutyRosterAdjacent(entryIdStr, direction) {
    if (!mongoose.isValidObjectId(entryIdStr))
        return { ok: false, error: 'invalid_id' };
    const sorted = await DutyRosterEntry.find()
        .sort({ sequence: 1, _id: 1 })
        .select('_id')
        .lean();
    const idx = sorted.findIndex((row) => String(row._id) === entryIdStr);
    if (idx < 0)
        return { ok: false, error: 'not_found' };
    const j = direction === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= sorted.length)
        return { ok: true };
    const reordered = [...sorted];
    [reordered[idx], reordered[j]] = [reordered[j], reordered[idx]];
    const ids = reordered.map((row) => String(row._id));
    return adminSetDutyRosterOrder(ids);
}
//# sourceMappingURL=duty-roster.service.js.map