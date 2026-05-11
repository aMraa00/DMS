/** Дэг-3: 20:00-оос хойш зочин оруулахгүй → нэвтрэх цагийн цаг ≤ 19 (анхдугаар огнооны эхний цэг) */
export declare function assertGuestVisitWindow(checkIn: Date, checkOut: Date): void;
/** 4.2.11: түр чөлөө 1–3 хоног */
export declare function assertLeaveDays(leaveDate: Date, returnDate: Date): void;
/** 3.3.2: байраас гарах — дор хаяж 7 хоногийн өмнө */
export declare function assertExitNoticeDays(requestedExitDate: Date, now?: Date): void;
