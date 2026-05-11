// i18n.jsx — Mongolian + English strings
const STRINGS = {
  mn: {
    appName: "DMS", appSub: "Дотуур байрны систем",
    universityShort: "State University", universityFull: "Улсын Их Сургууль",

    // Nav
    nav_dashboard: "Хяналтын самбар",
    nav_booking: "Өрөө захиалга",
    nav_payment: "Төлбөр",
    nav_contract: "Гэрээ",
    nav_daily: "Өдөр тутмын",
    nav_admin: "Админ",
    nav_reports: "Тайлан",
    nav_tokens: "Дизайн систем",

    // Roles
    role_student: "Оюутан",
    role_staff: "Ажилтан",
    role_accountant: "Санхүү",
    role_admin: "Админ",

    // Login
    login_welcome: "Тавтай морилно уу",
    login_title: "Дотуур байрны мэдээллийн систем",
    login_lead: "Өрөө захиалах, төлбөр төлөх, гэрээ байгуулах, өдөр тутмын хүсэлт илгээх — нэг л дороос.",
    login_perk_1: "Албан ёсны SIS-тэй холбогдсон",
    login_perk_2: "Бүх төхөөрөмжөөс хандах боломжтой",
    login_perk_3: "Бодит цагийн мэдэгдэл",

    login_tab_west: "WEST",
    login_tab_email: "И-мэйлээр",
    login_tab_register: "Бүртгэл",

    login_card_title: "Бүртгэлдээ нэвтрэх",
    login_card_sub: "Дотуур байрны системд хандана уу",

    f_loginName: "Нэвтрэх нэр (loginName)",
    f_loginName_ph: "жнь. B210123456",
    f_password: "Нууц үг",
    f_password_ph: "Нууц үгээ оруулна уу",
    f_email: "И-мэйл хаяг",
    f_email_ph: "name@university.edu",
    f_studentId: "Оюутны код",
    f_studentId_ph: "B210123456",
    f_fullname: "Бүтэн нэр",
    f_fullname_ph: "Овог Нэр",
    f_gender: "Хүйс",
    f_male: "Эрэгтэй", f_female: "Эмэгтэй", f_other: "Бусад",
    f_password_new: "Нууц үг үүсгэх",
    f_password_new_ph: "Хамгийн багадаа 8 тэмдэгт",

    btn_login: "Нэвтрэх",
    btn_register: "Бүртгүүлэх",
    btn_forgot: "Нууц үгээ мартсан уу?",

    west_warn_title: "WEST бүртгэлтэй оюутнууд",
    west_warn_msg: "Сургуулийн SIS-тэй ижил loginName ба нууц үгээ ашиглана уу. Хэрэв шинэ элсэгч бол доорх «Бүртгэл» табыг сонгоно уу.",

    email_demo_title: "Демо данс",
    email_demo_msg: "Туршихдаа дараах данс ашиглаарай: ",

    err_required: "Энэ талбарыг бөглөнө үү",
    err_invalid_email: "Зөв и-мэйл оруулна уу",
    err_short_password: "Нууц үг 8-аас дээш тэмдэгттэй байх ёстой",
    err_login: "Нэвтрэх нэр эсвэл нууц үг буруу байна",

    // Dashboard
    dash_hi: "Сайн байна уу,",
    dash_today: "Өнөөдөр",
    dash_quick: "Шуурхай үйлдэл",
    dash_stat_room: "Миний өрөө",
    dash_stat_balance: "Үлдэгдэл төлбөр",
    dash_stat_contract: "Гэрээ",
    dash_stat_requests: "Идэвхтэй хүсэлт",

    next_steps: "Дараагийн алхам",
    activity: "Сүүлийн үйл явдал",

    // Booking
    booking_title: "Өрөөний захиалга",
    booking_sub: "5 алхамтай — таны сонголтыг хадгалж, дараа нь админ батална.",
    step_building: "Байр",
    step_floor: "Давхар",
    step_room: "Өрөө",
    step_priority: "Эрэмбэ",
    step_review: "Хянаж илгээх",

    btn_back: "Буцах", btn_next: "Үргэлжлүүлэх", btn_submit: "Хүсэлт илгээх",

    // Payment
    pay_title: "Төлбөр",
    pay_balance: "Одоогийн үлдэгдэл",
    pay_due: "Төлөх хугацаа",
    pay_history: "Төлбөрийн түүх",
    pay_method_qpay: "QPay-р төлөх",
    pay_method_bank: "Банкаар шилжүүлэх",
    pay_status_paid: "Төлсөн",
    pay_status_pending: "Хүлээгдэж буй",
    pay_status_overdue: "Хугацаа хэтэрсэн",

    // Contract
    contract_title: "Гэрээ",
    contract_status: "Гэрээний төлөв",
    contract_sign: "Цахим гарын үсэг зурах",
    contract_remind: "Гэрээгээ 7 хоногийн дотор баталгаажуулна уу",

    // Daily
    daily_title: "Өдөр тутмын үйлчилгээ",
    daily_guest: "Зочин",
    daily_leave: "Түр чөлөө",
    daily_moveout: "Гарах",
    daily_complaint: "Санал гомдол",
    daily_property: "Эд хогшил",

    // Admin
    admin_title: "Админ самбар",
    admin_pending_rooms: "Хүлээгдэж буй өрөө хуваарилалт",
    admin_pending_payments: "Төлбөрийн тойм",

    // Reports
    reports_title: "Тайлан",
    reports_export_pdf: "PDF татах",
    reports_export_xlsx: "Excel татах",

    // Tokens
    tokens_title: "Дизайн систем",
    tokens_sub: "Өнгө, типографи, зай, бөөрөнхий булан, сүүдэр, glass токенууд.",
  },
  en: {
    appName: "DMS", appSub: "Dorm Management System",
    universityShort: "State University", universityFull: "State University",

    nav_dashboard: "Dashboard",
    nav_booking: "Room booking",
    nav_payment: "Payments",
    nav_contract: "Contract",
    nav_daily: "Daily services",
    nav_admin: "Admin",
    nav_reports: "Reports",
    nav_tokens: "Design system",

    role_student: "Student",
    role_staff: "Staff",
    role_accountant: "Accountant",
    role_admin: "Admin",

    login_welcome: "Welcome back",
    login_title: "Dorm Management System",
    login_lead: "Reserve a room, pay your dues, sign contracts and file daily requests — all in one place.",
    login_perk_1: "Connected to the official SIS",
    login_perk_2: "Works on every device",
    login_perk_3: "Real-time notifications",

    login_tab_west: "WEST",
    login_tab_email: "Email",
    login_tab_register: "Register",

    login_card_title: "Sign in to your account",
    login_card_sub: "Access the dorm management system",

    f_loginName: "Login name",
    f_loginName_ph: "e.g. B210123456",
    f_password: "Password",
    f_password_ph: "Enter your password",
    f_email: "Email address",
    f_email_ph: "name@university.edu",
    f_studentId: "Student ID",
    f_studentId_ph: "B210123456",
    f_fullname: "Full name",
    f_fullname_ph: "First Last",
    f_gender: "Gender",
    f_male: "Male", f_female: "Female", f_other: "Other",
    f_password_new: "Create password",
    f_password_new_ph: "Min. 8 characters",

    btn_login: "Sign in",
    btn_register: "Create account",
    btn_forgot: "Forgot password?",

    west_warn_title: "Students with WEST credentials",
    west_warn_msg: "Use the same login name and password as your campus SIS. New students should switch to the Register tab.",

    email_demo_title: "Demo account",
    email_demo_msg: "For testing, use: ",

    err_required: "This field is required",
    err_invalid_email: "Enter a valid email",
    err_short_password: "Password must be at least 8 characters",
    err_login: "Incorrect login name or password",

    dash_hi: "Hello,",
    dash_today: "Today",
    dash_quick: "Quick actions",
    dash_stat_room: "My room",
    dash_stat_balance: "Outstanding balance",
    dash_stat_contract: "Contract",
    dash_stat_requests: "Active requests",

    next_steps: "Next steps",
    activity: "Recent activity",

    booking_title: "Room booking",
    booking_sub: "Five steps — your choice is saved and approved by admin.",
    step_building: "Building",
    step_floor: "Floor",
    step_room: "Room",
    step_priority: "Priority",
    step_review: "Review",

    btn_back: "Back", btn_next: "Continue", btn_submit: "Submit request",

    pay_title: "Payments",
    pay_balance: "Current balance",
    pay_due: "Due date",
    pay_history: "Payment history",
    pay_method_qpay: "Pay with QPay",
    pay_method_bank: "Bank transfer",
    pay_status_paid: "Paid",
    pay_status_pending: "Pending",
    pay_status_overdue: "Overdue",

    contract_title: "Contract",
    contract_status: "Contract status",
    contract_sign: "Sign electronically",
    contract_remind: "Confirm your contract within 7 days",

    daily_title: "Daily services",
    daily_guest: "Guest pass",
    daily_leave: "Short leave",
    daily_moveout: "Move-out",
    daily_complaint: "Complaint",
    daily_property: "Property",

    admin_title: "Admin overview",
    admin_pending_rooms: "Pending room assignments",
    admin_pending_payments: "Payment overview",

    reports_title: "Reports",
    reports_export_pdf: "Export PDF",
    reports_export_xlsx: "Export Excel",

    tokens_title: "Design system",
    tokens_sub: "Colors, type, spacing, radius, shadow and glass tokens.",
  }
};

function useT(lang) {
  return React.useCallback((k) => (STRINGS[lang] && STRINGS[lang][k]) || STRINGS.mn[k] || k, [lang]);
}

window.STRINGS = STRINGS;
window.useT = useT;
