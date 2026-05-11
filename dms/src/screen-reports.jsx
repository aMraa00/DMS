// screen-reports.jsx — Reports

function ReportsScreen({ t, push }) {
  const [period, setPeriod] = React.useState("2026-05");
  return (
    <div>
      <PageHeader crumbs={[t("nav_reports")]} title={t("reports_title")} sub="Сар бүрийн орлого, ашиглалт, дотуур байрны KPI"
        action={
          <div className="row">
            <Select value={period} onChange={setPeriod} options={[
              { value: "2026-05", label: "2026 V сар" },
              { value: "2026-04", label: "2026 IV сар" },
              { value: "2026-03", label: "2026 III сар" },
              { value: "2026-Q1", label: "2026 I улирал" },
            ]}/>
            <Button variant="secondary" icon={<IcDownload size={14}/>}>{t("reports_export_xlsx")}</Button>
            <Button variant="primary" icon={<IcDownload size={14}/>}>{t("reports_export_pdf")}</Button>
          </div>
        }/>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <Stat accent label="Цуглуулсан орлого" value={fmtMNT(218400000)} delta="↑ 12.4% өмнөх сартай харьцуулахад"/>
        <Stat label="Эзэлж буй %" value="86%" delta="412 / 480 ор" deltaTone="up"/>
        <Stat label="Дундаж хариу өгөх хугацаа" value="14ц" delta="Гомдол → шийдвэр"/>
        <Stat label="Цуцлагдсан гэрээ" value="3" delta="↓ 2 өмнөх сартай харьцуулахад" deltaTone="up"/>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <Card title="Орлого — сар бүр" sub="2026 он · ₮ сая">
          <BarChart
            labels={["I", "II", "III", "IV", "V"]}
            values={[178, 192, 204, 218, 174]}
            target={200}
          />
        </Card>
        <Card title="Эзэлж буй — байр бүр" sub="Сул орны хувь">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MOCK.buildings.map(b => {
              const pct = Math.round((b.total - b.available) / b.total * 100);
              return (
                <div key={b.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span><b>{b.name}</b> <span style={{ color: "var(--text-muted)" }}>· {b.code}</span></span>
                    <span className="num">{pct}%</span>
                  </div>
                  <div style={{ height: 8, background: "var(--ink-100)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`,
                                  background: pct > 90 ? "var(--err-500)" : pct > 75 ? "var(--primary)" : "var(--ok-500)" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-3">
        <Card title="Хүсэлтийн төрөл — энэ сар" sub="Өдөр тутмын модуль">
          <Donut segments={[
            { v: 38, c: "var(--primary)", l: "Зочин" },
            { v: 24, c: "var(--accent)", l: "Түр чөлөө" },
            { v: 18, c: "var(--warn-500)", l: "Гомдол" },
            { v: 12, c: "var(--ok-500)", l: "Эд хогшил" },
            { v: 8,  c: "var(--ink-400)", l: "Гарах" },
          ]}/>
        </Card>
        <Card title="Гомдол — ангилал" sub="Энэ сар · 18 нийт">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Халаалт", 7], ["Цэвэрлэгээ", 4], ["Усан хангамж", 3],
              ["Цахилгаан", 2], ["Хооллолт", 1], ["Бусад", 1],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: "0 0 90px", fontSize: 12 }}>{k}</span>
                <div style={{ flex: 1, height: 6, background: "var(--ink-100)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${v / 7 * 100}%`, background: "var(--primary)" }}/>
                </div>
                <span className="num" style={{ flex: "0 0 24px", textAlign: "right", fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Хяналтын үзүүлэлт" sub="2026 V сарын тэмдэглэл">
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            <li><KPI ok ttl="Бүртгэлийн зөрүү" sub="Хямралгүй"/></li>
            <li><KPI ok ttl="Гэрээний бүрэн бүтэн байдал" sub="412/412 идэвхтэй"/></li>
            <li><KPI warn ttl="Хариу өгөх хугацаа" sub="14ц > 12ц зорилт"/></li>
            <li><KPI ok ttl="Аюулгүй байдал" sub="Зөрчлийн бүртгэл — 0"/></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function BarChart({ labels, values, target }) {
  const max = Math.max(...values, target || 0) * 1.1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 180, padding: "10px 0", borderBottom: "1px dashed var(--border)", position: "relative" }}>
        {target && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: `${target / max * 100}%`,
                       borderTop: "1px dashed var(--accent)", fontSize: 10, color: "var(--accent)", paddingLeft: 4 }}>
            <span style={{ background: "var(--surface)", padding: "0 4px" }}>зорилт {target}M</span>
          </div>
        )}
        {values.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }}>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>{v}M</div>
            <div style={{ width: "100%", maxWidth: 38,
                         height: `${v / max * 100}%`,
                         background: i === values.length - 1 ? "var(--accent)" : "var(--primary)",
                         borderRadius: "var(--r-sm) var(--r-sm) 0 0",
                         transition: "height .4s" }}/>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
        {labels.map((l, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "var(--text-muted)" }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function Donut({ segments }) {
  const total = segments.reduce((a, b) => a + b.v, 0);
  let cum = 0;
  const R = 56, C = 2 * Math.PI * R;
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--ink-100)" strokeWidth="14"/>
        {segments.map((s, i) => {
          const len = (s.v / total) * C;
          const off = -cum;
          cum += len;
          return (
            <circle key={i} cx="70" cy="70" r={R} fill="none"
                    stroke={s.c} strokeWidth="14"
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={off}
                    transform="rotate(-90 70 70)"
                    strokeLinecap="butt"/>
          );
        })}
        <text x="70" y="68" textAnchor="middle" style={{ fontSize: 22, fontWeight: 600, fill: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{total}</text>
        <text x="70" y="86" textAnchor="middle" style={{ fontSize: 10, fill: "var(--text-muted)" }}>хүсэлт</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.c }}/>
            <span style={{ flex: 1 }}>{s.l}</span>
            <span className="num" style={{ color: "var(--text-muted)" }}>{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KPI({ ok, warn, err, ttl, sub }) {
  const tone = ok ? "ok" : warn ? "warn" : "err";
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{
        width: 28, height: 28, borderRadius: 999,
        display: "grid", placeItems: "center",
        background: `var(--${tone}-50)`, color: `var(--${tone}-700)`
      }}>
        {ok ? <IcCheck size={14}/> : <IcAlert size={14}/>}
      </span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{ttl}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{sub}</div>
      </div>
    </div>
  );
}

window.ReportsScreen = ReportsScreen;
