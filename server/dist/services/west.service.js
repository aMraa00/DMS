function westGenderToMF(g) {
    const raw = String(g ?? '').toLowerCase();
    if (raw === 'f' || raw.includes('эмэгтэй') || raw.includes('female'))
        return 'F';
    return 'M';
}
/** Жишээ: "Б.Амаржаргал" → овогийн товч + нэр */
function splitButenNer(butenNer) {
    const t = typeof butenNer === 'string' ? butenNer.trim() : '';
    if (!t)
        return { firstName: 'Оюутан', lastName: '' };
    const parts = t.split('.').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return { lastName: parts[0], firstName: parts.slice(1).join(' ') };
    }
    return { firstName: t, lastName: '' };
}
/** WEST SSO; амжилттай бол `user` эсвэл `student`/`data` объектыг буцаана. */
export async function westStudentLogin(loginName, password, url, timeoutMs) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    let res;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ loginName, password }),
            signal: ac.signal,
        });
    }
    catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
            const sec = Math.round(timeoutMs / 1000);
            throw new Error(`WEST хариу ${sec} сек-оос хэтэрлээ (сүлжээ эсвэл WEST сервер ачаалалтай). Дотоод демо: нэвтрэх хуудасны «И-мэйлээр» таб.`);
        }
        throw e;
    }
    finally {
        clearTimeout(t);
    }
    const text = await res.text();
    let body = {};
    try {
        body = JSON.parse(text);
    }
    catch {
        body = { message: text };
    }
    if (!res.ok) {
        throw new Error(typeof body.message === 'string' ? body.message : `WEST login failed (${res.status})`);
    }
    if (body.success === false) {
        throw new Error(typeof body.message === 'string' ? body.message : 'WEST: нэвтрэлт амжилтгүй');
    }
    return body;
}
export function westPayloadToProfile(body) {
    const s = (body.user ?? body.student ?? body.data ?? {});
    const westLoginName = String(s.loginName ?? '').trim();
    const email = String(s.email ?? `${westLoginName || 'student'}@must.edu.mn`)
        .toLowerCase()
        .trim();
    const { firstName, lastName } = splitButenNer(s.butenNer);
    const registerNumber = s.regnum != null ? String(s.regnum).trim() : undefined;
    const studentId = westLoginName || registerNumber || '';
    const school = s.school_id != null ? String(s.school_id) : String(s.school ?? '');
    const program = s.class_id != null
        ? String(s.class_id)
        : s.department_id != null
            ? String(s.department_id)
            : String(s.program ?? s.angi ?? '');
    const level = s.kurs != null ? String(s.kurs) : s.level != null ? String(s.level) : undefined;
    return {
        westLoginName: westLoginName || studentId,
        email,
        firstName: firstName || 'Оюутан',
        lastName,
        studentId,
        registerNumber,
        program,
        school,
        gender: westGenderToMF(s.gender),
        region: s.region != null ? String(s.region) : undefined,
        level,
    };
}
//# sourceMappingURL=west.service.js.map