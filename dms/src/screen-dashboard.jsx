// screen-dashboard.jsx — Student dashboard

function DashboardScreen({ t, role, setRoute, push }) {
  const me = role === "student" ? MOCK.students[0] : { name: role === "admin" ? "О. Хүлэг" : "Ж. Цэцгээ" };
  const today = new Date().toLocaleDateString(t === window.useT ? "mn-MN" : "mn-MN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (role !== "student") {
    return <StaffOverview t={t} setRoute={setRoute}/>;
  }

  return (
    <div>
      <PageHeader
        crumbs={[t("nav_dashboard")]}
        title={`${t("dash_hi")} ${me.name.split(" ")[1] || me.name}`}
        sub={`${t("dash_today")} · ${today}`}
        action={
          <Button variant="primary" icon={<IcPlus size={14}/>} onClick={() => setRoute("daily")}>
            Хүсэлт нэмэх
          </Button>
        }
      />

      {/* Banner — contract reminder */}
      <div className="banner warn" style={{ marginBottom: 24 }}>
        <IcAlert size={18}/>
        <div style={{ flex: 1 }}>
          <div className="ttl">{t("contract_remind")}</div>
          <div className="msg">2026 II улирлын байрны гэрээ цахим гарын үсэг хүлээж байна. 7 хоногийн хугацаатай.</div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setRoute("contract")}>
          {t("contract_sign")}
        </Button>
      </div>

      {/* Stat row */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <Stat label={t("dash_stat_room")} value="304B" delta="B-Block · 3-р давхар"/>
        <Stat label={t("dash_stat_balance")} value={fmtMNT(0)} delta="Ирэх төлбөр: 2026-08-01" deltaTone="up"/>
        <Stat label={t("dash_stat_contract")} value="Идэвхтэй" delta="2026-09-01 хүртэл" deltaTone="up"/>
        <Stat label={t("dash_stat_requests")} value="2" delta="1 батлагдсан · 1 хүлээгдэж буй"/>
      </div>

      {/* Quick actions */}
      <h2 className="section-title">{t("dash_quick")}</h2>
      <div className="grid grid-3" style={{ marginBottom: 28 }}>
        <QuickCard t={t} icon={<IcBed size={20}/>} title={t("nav_booking")}
          desc="Дараагийн улирлын өрөөгөө захиалаарай" cta="Эхлэх" onClick={() => setRoute("booking")}/>
        <QuickCard t={t} icon={<IcWallet size={20}/>} title={t("nav_payment")}
          desc="QPay, банкаар төлбөр төлөх, түүх үзэх" cta="Төлбөрөө харах" onClick={() => setRoute("payment")}/>
        <QuickCard t={t} icon={<IcContract size={20}/>} title={t("nav_contract")}
          desc="Гэрээний нөхцлийг уншиж, цахим гарын үсэг зурах" cta="Гэрээ нээх" onClick={() => setRoute("contract")}/>
      </div>

      <div className="grid grid-2">
        <Card title={t("activity")} sub="Сүүлийн 7 хоног">
          <div className="timeline">
            {MOCK.activity.map((a, i) => (
              <div key={i} className={`tl-item ${i === 0 ? "active" : "done"}`}>
                <div className="when">{a.when}</div>
                <div className="what">{a.what}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("next_steps")} sub="Танай дараагийн алхам">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <NextStep ok title="Бүртгэл баталгаажсан" sub="2025-09-01"/>
            <NextStep ok title="Өрөө хуваарилагдсан" sub="B-Block · 304B · 2025-09-10"/>
            <NextStep ok title="2026 I улирлын төлбөр" sub="2026-04-01 · ₮ 1,320,000"/>
            <NextStep active title="2026 II улирлын гэрээ зурах" sub="3 өдрийн дотор"/>
            <NextStep title="2026 II улирлын төлбөр" sub="2026-08-01 хүртэл"/>
          </div>
        </Card>
      </div>
    </div>
  );
}

function QuickCard({ icon, title, desc, cta, onClick }) {
  return (
    <button onClick={onClick} className="card" style={{
      textAlign: "left", padding: "var(--pad-card)", cursor: "pointer",
      fontFamily: "inherit", color: "inherit", background: "var(--surface)",
      transition: "border-color .14s, box-shadow .14s, transform .04s"
    }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}>
      <div style={{
        width: 44, height: 44, borderRadius: "var(--r)",
        background: "var(--primary-soft)", color: "var(--primary)",
        display: "grid", placeItems: "center", marginBottom: 14
      }}>{icon}</div>
      <div style={{ fontSize: "var(--t-md)", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: "var(--t-sm)", color: "var(--text-muted)", marginBottom: 14 }}>{desc}</div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--primary)", fontSize: "var(--t-sm)", fontWeight: 500 }}>
        {cta} <IcArrow size={14}/>
      </div>
    </button>
  );
}

function NextStep({ ok, active, title, sub }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{
        width: 22, height: 22, borderRadius: 999, flex: "0 0 auto",
        display: "grid", placeItems: "center",
        background: ok ? "var(--ok-500)" : active ? "var(--primary)" : "var(--ink-100)",
        color: ok || active ? "white" : "var(--text-muted)",
        boxShadow: active ? "0 0 0 4px var(--primary-soft)" : "none"
      }}>
        {ok ? <IcCheck size={12}/> : active ? <IcArrow size={12}/> : null}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--t-sm)", fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: "var(--t-xs)", color: "var(--text-muted)" }}>{sub}</div>
      </div>
    </div>
  );
}

function StaffOverview({ t, setRoute }) {
  return (
    <div>
      <PageHeader crumbs={[t("nav_dashboard")]} title="Үйл ажиллагааны тойм" sub="Энэ долоо хоногийн төлөв"
        action={<Button variant="secondary" icon={<IcDownload size={14}/>}>Тайлан татах</Button>}/>
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <Stat accent label="Орогнож буй оюутан" value="412" delta="↑ 6 шинэ энэ долоо хоногт"/>
        <Stat label={t("admin_pending_rooms")} value="6" delta="ESC-аас 2 өдрийн дотор"/>
        <Stat label="Хугацаа хэтэрсэн төлбөр" value="18" delta="₮ 23,760,000" deltaTone="down"/>
        <Stat label="Идэвхтэй гэрээ" value="412 / 480" delta="86% бөглөгдсөн" deltaTone="up"/>
      </div>
      <div className="grid grid-2">
        <Card title={t("admin_pending_rooms")} sub="Сүүлд илгээсэн" action={
          <Button size="sm" variant="ghost" onClick={() => setRoute("admin")} icon={<IcArrow size={12}/>}>Бүгд</Button>
        }>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {MOCK.pendingAllocations.slice(0, 4).map(r => (
              <div key={r.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 6, height: 6, borderRadius: 999,
                  background: r.priority <= 2 ? "var(--err-500)" : r.priority === 3 ? "var(--warn-500)" : "var(--ok-500)" }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.student}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.building} · {r.submitted}</div>
                </div>
                <Badge tone={r.priority <= 2 ? "err" : r.priority === 3 ? "warn" : "default"}>{r.priorityLabel}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Өнөөдрийн чухал зүйл" sub="Action хэрэгтэй">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Banner tone="warn" title="6 өрөө хуваарилалт хүлээгдэж буй" msg="Эрэмбээр шийдвэрлэнэ үү"/>
            <Banner tone="err" title="18 хэрэглэгчийн төлбөр хугацаа хэтэрсэн" msg="₮ 23,760,000 нийт өр"/>
            <Banner tone="info" title="Сар бүрийн тайлан 8 өдрийн дотор" msg="2026 V сарын хаалт"/>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Banner({ tone, title, msg }) {
  return (
    <div className={`banner ${tone}`}>
      <IcInfo size={16}/>
      <div>
        <div className="ttl">{title}</div>
        <div className="msg">{msg}</div>
      </div>
    </div>
  );
}

window.DashboardScreen = DashboardScreen;
window.Banner = Banner;
