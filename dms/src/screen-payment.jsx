// screen-payment.jsx — Payments

function PaymentScreen({ t, role, push }) {
  const [filter, setFilter] = React.useState("all");
  const isStudent = role === "student";

  const rows = MOCK.payments.filter(p => filter === "all" ? true : p.status === filter);

  const cols = [
    { key: "id",     label: "Лавлах", render: (r) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.id}</span> },
    { key: "date",   label: "Огноо",   render: (r) => <span className="num">{r.date}</span> },
    { key: "desc",   label: "Тайлбар" },
    { key: "method", label: "Хэрэгсэл" },
    { key: "amount", label: "Дүн", right: true,
      render: (r) => <span className="num" style={{ fontWeight: 500 }}>{fmtMNT(r.amount)}</span> },
    { key: "status", label: "Төлөв", render: (r) => (
      <Badge tone={r.status === "paid" ? "ok" : r.status === "pending" ? "warn" : "err"} dot>
        {r.status === "paid" ? t("pay_status_paid") : r.status === "pending" ? t("pay_status_pending") : t("pay_status_overdue")}
      </Badge>
    )},
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav_payment")]} title={t("pay_title")}
        sub={isStudent ? "Танай төлбөрийн түүх ба ирэх төлөлт" : "Бүх оюутны төлбөрийн тойм"}
        action={
          <div className="row">
            <Button variant="secondary" icon={<IcDownload size={14}/>}>Excel</Button>
            {isStudent && <Button variant="primary" icon={<IcWallet size={14}/>}>Төлбөр төлөх</Button>}
          </div>
        }/>

      {isStudent && (
        <div className="grid grid-3" style={{ marginBottom: 24 }}>
          <Card padless>
            <div style={{ padding: 22, background: "linear-gradient(135deg, var(--primary), var(--accent))", color: "white", borderRadius: "var(--r-md)" }}>
              <div style={{ fontSize: 12, opacity: .85, textTransform: "uppercase", letterSpacing: ".06em" }}>{t("pay_balance")}</div>
              <div style={{ fontSize: 32, fontWeight: 600, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>{fmtMNT(660000)}</div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: .85 }}>{t("pay_due")}: 2026-08-01</div>
              <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                <button className="btn btn-sm" style={{ background: "white", color: "var(--primary)", fontWeight: 600 }}>
                  <IcWallet size={13}/> {t("pay_method_qpay")}
                </button>
                <button className="btn btn-sm" style={{ background: "rgba(255,255,255,.2)", color: "white", border: "1px solid rgba(255,255,255,.35)" }}>
                  {t("pay_method_bank")}
                </button>
              </div>
            </div>
          </Card>
          <Card title="Энэ улирлын тойм" sub="2026 II улирал">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <KV k="Үндсэн төлбөр" v={fmtMNT(1200000)}/>
              <KV k="Эд хогшлын барьцаа" v={fmtMNT(80000)}/>
              <KV k="Бусад" v={fmtMNT(40000)}/>
              <hr className="sep" style={{ margin: "6px 0" }}/>
              <KV k={<b>Нийт</b>} v={<b>{fmtMNT(1320000)}</b>}/>
              <div className="kpi-line">
                <div className="seg" style={{ width: "50%", background: "var(--ok-500)" }}/>
                <div className="seg" style={{ width: "50%", background: "var(--ink-200)" }}/>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                ₮ 660,000 төлсөн / ₮ 660,000 үлдсэн
              </div>
            </div>
          </Card>
          <Card title="Төлбөрийн арга" sub="Холбогдсон хэрэгсэл">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Method ic={<IcWallet size={16}/>} ttl="QPay" sub="Холбогдсон · Khan, TDB"/>
              <Method ic={<IcReceipt size={16}/>} ttl="Банкны шилжүүлэг" sub="Голомт · 1234 5678 9012"/>
              <Button variant="ghost" size="sm" icon={<IcPlus size={12}/>}>Шинэ нэмэх</Button>
            </div>
          </Card>
        </div>
      )}

      {!isStudent && (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <Stat accent label="Цуглуулсан / Хүлээгдэж буй" value="79.5%" delta={`${fmtMNT(MOCK.paymentOverview.collected)} / ${fmtMNT(MOCK.paymentOverview.expected)}`}/>
          <Stat label="Төлсөн" value={MOCK.paymentOverview.paid} delta="↑ 22 энэ долоо хоног" deltaTone="up"/>
          <Stat label="Хүлээгдэж буй" value={MOCK.paymentOverview.pending}/>
          <Stat label="Хугацаа хэтэрсэн" value={MOCK.paymentOverview.overdue} delta={fmtMNT(23760000)} deltaTone="down"/>
        </div>
      )}

      <Card padless>
        <div className="card-hd">
          <div>
            <h3>{t("pay_history")}</h3>
            <div className="sub">{rows.length} бичлэг</div>
          </div>
          <div className="row">
            {[
              ["all", "Бүгд"], ["paid", t("pay_status_paid")],
              ["pending", t("pay_status_pending")], ["overdue", t("pay_status_overdue")]
            ].map(([k, l]) => (
              <button key={k} className={`btn btn-sm ${filter === k ? "btn-primary" : "btn-ghost"}`} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <SortableTable columns={cols} rows={rows} initialSort={{ key: "date", dir: "desc" }}/>
      </Card>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span className="num">{v}</span>
    </div>
  );
}

function Method({ ic, ttl, sub }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ width: 36, height: 36, borderRadius: "var(--r)", background: "var(--primary-soft)", color: "var(--primary)", display: "grid", placeItems: "center" }}>{ic}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{ttl}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
      </div>
      <Badge tone="ok" dot>Идэвхтэй</Badge>
    </div>
  );
}

window.PaymentScreen = PaymentScreen;
