// data.jsx — Mock data + helpers

const MOCK = {
  students: [
    { id: "B210123456", name: "Б. Энхжаргал", email: "enkhjargal@university.edu", room: "B-Block · 304B", balance: 0, contract: "active" },
    { id: "B220987654", name: "Д. Тэмүүлэн", email: "temuulen@university.edu", room: "—", balance: 1320000, contract: "pending" },
    { id: "B230112233", name: "Г. Сараа", email: "saraa@university.edu", room: "C-Block · 215A", balance: 0, contract: "active" },
    { id: "B210556677", name: "Ц. Алтанзул", email: "altanzul@university.edu", room: "—", balance: 1320000, contract: "expired" },
    { id: "B220334455", name: "Н. Билгүүн", email: "bilguun@university.edu", room: "A-Block · 412C", balance: 660000, contract: "active" },
    { id: "B230778899", name: "О. Мөнхзул", email: "munkhzul@university.edu", room: "—", balance: 0, contract: "draft" },
  ],

  buildings: [
    { id: "A", code: "A-Block", name: "A байр",  beds: "Эрэгтэй · 4 хүний өрөө", floors: 5, rooms_per_floor: 16, available: 12, total: 320 },
    { id: "B", code: "B-Block", name: "B байр",  beds: "Эрэгтэй · 2 хүний өрөө", floors: 6, rooms_per_floor: 14, available: 8,  total: 280 },
    { id: "C", code: "C-Block", name: "C байр",  beds: "Эмэгтэй · 4 хүний өрөө", floors: 5, rooms_per_floor: 16, available: 22, total: 320 },
    { id: "D", code: "D-Block", name: "D байр",  beds: "Эмэгтэй · 2 хүний өрөө", floors: 6, rooms_per_floor: 14, available: 4,  total: 280 },
  ],

  payments: [
    { id: "INV-2026-04-018", date: "2026-04-01", desc: "2026 II улирлын байрны төлбөр", amount: 1320000, status: "paid",    method: "QPay" },
    { id: "INV-2026-03-114", date: "2026-03-04", desc: "Гэрээний баталгаажуулалт",      amount: 100000,  status: "paid",    method: "Bank" },
    { id: "INV-2025-10-091", date: "2025-10-02", desc: "2025 I улирлын байрны төлбөр",  amount: 1320000, status: "paid",    method: "QPay" },
    { id: "INV-2026-05-201", date: "2026-05-15", desc: "Зуны төлбөр (2026)",            amount: 660000,  status: "pending", method: "—" },
    { id: "INV-2025-09-002", date: "2025-09-10", desc: "Эд хогшлын барьцаа",            amount: 80000,   status: "paid",    method: "Bank" },
  ],

  pendingAllocations: [
    { id: "REQ-1041", student: "Д. Тэмүүлэн (B220987654)",  building: "B-Block", priority: 1, submitted: "2 цагийн өмнө", priorityLabel: "Маш яаралтай" },
    { id: "REQ-1040", student: "Ц. Алтанзул (B210556677)",  building: "D-Block", priority: 2, submitted: "5 цагийн өмнө", priorityLabel: "Яаралтай" },
    { id: "REQ-1039", student: "О. Мөнхзул (B230778899)",   building: "C-Block", priority: 3, submitted: "өчигдөр",       priorityLabel: "Дунд" },
    { id: "REQ-1038", student: "Б. Сүхбат (B220114455)",     building: "A-Block", priority: 4, submitted: "2 өдрийн өмнө", priorityLabel: "Бага" },
    { id: "REQ-1037", student: "Х. Нандин (B230998877)",     building: "C-Block", priority: 2, submitted: "2 өдрийн өмнө", priorityLabel: "Яаралтай" },
    { id: "REQ-1036", student: "А. Бат-Эрдэнэ (B210772233)", building: "A-Block", priority: 5, submitted: "3 өдрийн өмнө", priorityLabel: "Маш бага" },
  ],

  dailyRequests: [
    { id: "DLY-330", type: "Зочин",       title: "Эцэг эхийн зочлолт",       when: "2026-05-09 14:00", status: "approved" },
    { id: "DLY-329", type: "Түр чөлөө",   title: "Гэр бүлийн ажлаар (2 өдөр)", when: "2026-05-12",      status: "pending"  },
    { id: "DLY-328", type: "Санал гомдол", title: "Халаалт сулхан",            when: "2026-05-04",      status: "in-review"},
    { id: "DLY-327", type: "Эд хогшил",   title: "Шинэ ор/матрас",            when: "2026-05-02",      status: "approved" },
    { id: "DLY-326", type: "Гарах",       title: "Хичээлийн жил дуусах",      when: "2026-06-10",      status: "draft"    },
  ],

  activity: [
    { when: "Өнөөдөр · 09:24", what: "INV-2026-04-018 төлбөр амжилттай төлөгдлөө", kind: "ok" },
    { when: "Өчигдөр · 17:11", what: "Гэрээ цахим гарын үсгээр баталгаажлаа",       kind: "ok" },
    { when: "5 хоногийн өмнө", what: "Зочны хүсэлт DLY-330 зөвшөөрөгдлөө",          kind: "info" },
    { when: "10 хоногийн өмнө", what: "Өрөөний захиалга B-Block · 304B илгээгдлээ", kind: "info" },
  ],

  paymentOverview: {
    collected: 218400000,
    expected: 274500000,
    overdue: 18,
    paid: 412,
    pending: 56,
  },
};

function fmtMNT(n) {
  return "₮ " + Number(n).toLocaleString("mn-MN");
}

function priorityLabel(n) {
  return ["", "Маш яаралтай", "Яаралтай", "Дунд", "Бага", "Маш бага"][n] || "—";
}

window.MOCK = MOCK;
window.fmtMNT = fmtMNT;
window.priorityLabel = priorityLabel;
