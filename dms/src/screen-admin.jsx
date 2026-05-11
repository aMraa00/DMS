// screen-admin.jsx — Admin overview

function AdminScreen({ t, push }) {
  const [tab, setTab] = React.useState("rooms");
  const tabs = [
    { value: "rooms",    label: t("admin_pending_rooms"), icon: <IcBed size={14}/> },
    { value: "payments", label: t("admin_pending_payments"), icon: <IcWallet size={14}/> },
    { value: "students", label: "Оюутны жагсаалт", icon: <IcUsers size={14}/> },
    { value: "violations", label: "Зөрчил (ирээдүй)", icon: <IcShield size={14}/> },
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav_admin")]} title={t("admin_title")}
        sub="Хүлээгдэж буй өрөөний хуваарилалт, төлбөр болон оюутны жагсаалт"
        action={
          <div className="row">
            <Button variant="secondary" icon={<IcFilter size={14}/>}>Шүүлтүүр</Button>
            <Button variant="primary" icon={<IcDownload size={14}/>}>Excel татах</Button>
          </div>
        }/>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Stat label={t("admin_pending_rooms")} value="6" delta="3 яаралтай" deltaTone="down"/>
        <Stat label="Хүлээгдэж буй гэрээ" value="11"/>
        <Stat label="Хугацаа хэтэрсэн төлбөр" value="18" delta={fmtMNT(23760000)} deltaTone="down"/>
        <Stat label="Идэвхтэй санал гомдол" value="7" delta="2 шинэ"/>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} variant="line"/>
      </div>

      {tab === "rooms" && <PendingRoomsTable push={push}/>}
      {tab === "payments" && <PendingPaymentsTable/>}
      {tab === "students" && <StudentsTable/>}
      {tab === "violations" && (
        <Empty title="Зөрчлийн модуль ирээдүйд нэмэгдэнэ"
               message="Дотуур байрны журам зөрчилтэй холбоотой бүртгэл, хөнгөлөлт, гэрээ цуцлах функцууд энд байршина."
               action={<Button variant="secondary" icon={<IcInfo size={14}/>}>Дэлгэрэнгүй</Button>}/>
      )}
    </div>
  );
}

function PendingRoomsTable({ push }) {
  const cols = [
    { key: "id", label: "Лавлах", render: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</span> },
    { key: "student", label: "Оюутан" },
    { key: "building", label: "Байр" },
    { key: "priority", label: "Эрэмбэ", render: (r) => (
      <Badge tone={r.priority <= 2 ? "err" : r.priority === 3 ? "warn" : "default"} dot>{r.priorityLabel}</Badge>
    )},
    { key: "submitted", label: "Илгээсэн", sortable: false },
    { key: "_act", label: "", sortable: false, right: true, render: (r) => (
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); push({ tone: "warn", title: `${r.id} татгалзлаа` }); }}>
          <IcX size={12}/> Татгалзах
        </button>
        <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); push({ tone: "ok", title: `${r.id} баталгаажлаа`, message: r.building }); }}>
          <IcCheck size={12}/> Батлах
        </button>
      </div>
    )}
  ];
  return <SortableTable columns={cols} rows={MOCK.pendingAllocations} initialSort={{ key: "priority", dir: "asc" }}/>;
}

function PendingPaymentsTable() {
  const data = [
    { id: "INV-2026-04-201", student: "Ц. Алтанзул",   amount: 1320000, due: "2026-04-15", overdue: 23, status: "overdue" },
    { id: "INV-2026-04-185", student: "Б. Сүхбат",     amount: 660000,  due: "2026-04-20", overdue: 18, status: "overdue" },
    { id: "INV-2026-05-014", student: "Х. Нандин",     amount: 1320000, due: "2026-05-01", overdue: 7,  status: "pending" },
    { id: "INV-2026-05-021", student: "Д. Тэмүүлэн",   amount: 660000,  due: "2026-05-15", overdue: 0,  status: "pending" },
    { id: "INV-2026-05-027", student: "О. Мөнхзул",    amount: 1320000, due: "2026-05-15", overdue: 0,  status: "pending" },
  ];
  const cols = [
    { key: "id", label: "Лавлах", render: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</span> },
    { key: "student", label: "Оюутан" },
    { key: "amount", label: "Дүн", right: true, render: (r) => <span className="num">{fmtMNT(r.amount)}</span> },
    { key: "due", label: "Хугацаа" },
    { key: "overdue", label: "Хэтэрсэн", render: (r) => r.overdue > 0
      ? <Badge tone="err">{r.overdue} өдөр</Badge>
      : <Badge tone="default">—</Badge> },
    { key: "status", label: "Төлөв", render: (r) => (
      <Badge tone={r.status === "overdue" ? "err" : "warn"} dot>{r.status === "overdue" ? "Хэтэрсэн" : "Хүлээгдэж буй"}</Badge>
    )},
  ];
  return <SortableTable columns={cols} rows={data} initialSort={{ key: "overdue", dir: "desc" }}/>;
}

function StudentsTable() {
  const cols = [
    { key: "id",    label: "Код", render: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</span> },
    { key: "name",  label: "Нэр" },
    { key: "email", label: "И-мэйл", render: (r) => <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{r.email}</span> },
    { key: "room",  label: "Өрөө" },
    { key: "balance", label: "Үлдэгдэл", right: true, render: (r) => (
      <span className="num" style={{ color: r.balance > 0 ? "var(--err-700)" : "var(--text)" }}>
        {fmtMNT(r.balance)}
      </span>
    )},
    { key: "contract", label: "Гэрээ", render: (r) => (
      <Badge tone={r.contract === "active" ? "ok" : r.contract === "expired" ? "err" : r.contract === "pending" ? "warn" : "default"} dot>
        {r.contract === "active" ? "Идэвхтэй" : r.contract === "expired" ? "Дууссан" : r.contract === "pending" ? "Хүлээгдэж буй" : "Ноорог"}
      </Badge>
    )},
  ];
  return <SortableTable columns={cols} rows={MOCK.students}/>;
}

window.AdminScreen = AdminScreen;
