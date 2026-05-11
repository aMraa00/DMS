const UB_TZ = process.env.DEFAULT_TZ ?? 'Asia/Ulaanbaatar';
function calendarHourUTC(d, timeZone) {
    const h = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: 'numeric',
        hour12: false,
    }).formatToParts(d);
    const hp = h.find((p) => p.type === 'hour');
    return hp ? Number(hp.value) : d.getHours();
}
/** Дэг-3: 20:00-оос хойш зочин оруулахгүй → нэвтрэх цагийн цаг ≤ 19 (анхдугаар огнооны эхний цэг) */
export function assertGuestVisitWindow(checkIn, checkOut) {
    if (!(checkOut.getTime() > checkIn.getTime())) {
        throw new Error('checkOut нь checkIn-ээс хойш байна');
    }
    const inH = calendarHourUTC(checkIn, UB_TZ);
    if (inH >= 20) {
        throw new Error('Журмын Дэг-3: 20:00 цагаас хойш зочин нэвтрэх боломжгүй (УБ цагийн бүс)');
    }
}
/** 4.2.11: түр чөлөө 1–3 хоног */
export function assertLeaveDays(leaveDate, returnDate) {
    const ms = returnDate.getTime() - leaveDate.getTime();
    const days = Math.ceil(ms / 86_400_000);
    if (days < 1 || days > 3) {
        throw new Error('Түр чөлөө: 1–3 хоногийн завсарт байна уу шалгана уу');
    }
}
/** 3.3.2: байраас гарах — дор хаяж 7 хоногийн өмнө */
export function assertExitNoticeDays(requestedExitDate, now = new Date()) {
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const min = new Date(startToday);
    min.setDate(min.getDate() + 7);
    const want = new Date(requestedExitDate);
    want.setHours(0, 0, 0, 0);
    if (want.getTime() < min.getTime()) {
        throw new Error('Байраас гарах: дор хаяж 7 хоногийн өмнө мэдэгдэнэ үү');
    }
}
//# sourceMappingURL=daily-rules.service.js.map