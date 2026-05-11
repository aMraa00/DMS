// screen-contract.jsx — Contract & e-sign

function ContractScreen({ t, role, push }) {
  const [signed, setSigned] = React.useState(false);
  const [name, setName] = React.useState("");
  const [agreed, setAgreed] = React.useState({ rules: false, financial: false, conduct: false });
  const allAgreed = agreed.rules && agreed.financial && agreed.conduct && name.trim().length > 2;

  const sign = () => {
    setSigned(true);
    push({ tone: "ok", title: "Гэрээ амжилттай баталгаажлаа", message: "Цахим гарын үсэг бүртгэгдлээ" });
  };

  return (
    <div>
      <PageHeader crumbs={[t("nav_contract")]} title={t("contract_title")} sub="2026 II улирал · B-Block · 304B"
        action={<Button variant="secondary" icon={<IcDownload size={14}/>}>PDF татах</Button>}/>

      {!signed && (
        <div className="banner warn" style={{ marginBottom: 20 }}>
          <IcAlert size={18}/>
          <div style={{ flex: 1 }}>
            <div className="ttl">{t("contract_remind")}</div>
            <div className="msg">Хугацаа: 2026-05-15. Үлдсэн 7 хоног.</div>
          </div>
          <span className="kbd">2026-05-15</span>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <Card title="Гэрээний агуулга" sub="Дотуур байрны түрээслэх гэрээ № SU-2026-II-3041"
          action={<Badge tone={signed ? "ok" : "warn"} dot>{signed ? "Баталгаажсан" : "Гарын үсэг хүлээж буй"}</Badge>}>
          <div style={{ background: "var(--surface-2)", padding: "20px 22px", borderRadius: "var(--r)",
                       fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7,
                       maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)" }}>
            <div style={{ color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              I. ЕРӨНХИЙ ЗҮЙЛ
            </div>
            <div>1.1. Энэхүү гэрээ нь {t("universityFull")}-ийн дотуур байр (цаашид «Байр») болон оюутан (цаашид «Түрээслэгч») хооронд байгуулагдана.</div>
            <div>1.2. Гэрээний хугацаа: 2026-09-01-ээс 2027-06-15 хүртэл.</div>
            <div style={{ color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, margin: "16px 0 8px" }}>
              II. ТӨЛБӨР
            </div>
            <div>2.1. Сар бүрийн төлбөр: ₮ 220,000.</div>
            <div>2.2. Эд хогшлын барьцаа: ₮ 80,000 (нэг удаа).</div>
            <div>2.3. Төлбөр төлөгдөөгүй тохиолдолд тухайн сарын 25-ний дотор сануулга илгээгдэнэ.</div>
            <div style={{ color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, margin: "16px 0 8px" }}>
              III. ЁС ЗҮЙ БА ДЭГ ЖУРАМ
            </div>
            <div>3.1. Орох/гарах цаг: 06:00-23:00.</div>
            <div>3.2. Зочин хүлээн авах: 09:00-20:00 цагт; ямар нэгэн зочин шөнөжин үлдэх ёсгүй.</div>
            <div>3.3. Тамхи татах, согтууруулах ундаа уух хатуу хориотой.</div>
            <div style={{ color: "var(--text)", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, margin: "16px 0 8px" }}>
              IV. ГЭРЭЭГ ЦУЦЛАХ
            </div>
            <div>4.1. Талуудын аль аль нь 14 хоногийн өмнө бичгээр мэдэгдэж гэрээг цуцлах эрхтэй.</div>
          </div>
        </Card>

        <Card title={t("contract_sign")} sub="Цахим гарын үсэг — БҮЦБ-н стандарттай нийцнэ">
          {!signed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { k: "rules", l: "Дотуур байрны журамтай танилцаж, хүлээн зөвшөөрнө" },
                { k: "financial", l: "Санхүүгийн нөхцлийг ойлгож, цаг тухайд нь төлөхөөр зөвшөөрнө" },
                { k: "conduct", l: "Дэг журам, ёс зүйг сахихаа баталгаажуулна" },
              ].map(({ k, l }) => (
                <label key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed[k]} onChange={(e) => setAgreed({ ...agreed, [k]: e.target.checked })}
                         style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--primary)" }}/>
                  <span style={{ fontSize: 13 }}>{l}</span>
                </label>
              ))}
              <Input label="Бүтэн нэр (гарын үсэг)" placeholder="Овог Нэр" value={name}
                     onChange={(e) => setName(e.target.value)} lead={<IcSig size={14}/>}
                     hint="Энд оруулсан нэр нь гарын үсэг болон бүртгэгдэнэ."/>
              <Button variant="primary" disabled={!allAgreed} onClick={sign} icon={<IcSig size={14}/>}>
                Цахим гарын үсэг зурах
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 60, height: 60, margin: "0 auto 14px", borderRadius: 999, background: "var(--ok-500)", color: "white", display: "grid", placeItems: "center" }}>
                <IcCheck size={28}/>
              </div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Гэрээ баталгаажлаа</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
                {name} · {new Date().toLocaleString("mn-MN")}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>
                SHA-256 · 8c3a…f719
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Гэрээний түүх" sub="Сүүлийн үйл явдал" className="" style={{ marginTop: 20 }}>
        <div className="timeline">
          <div className="tl-item active">
            <div className="when">Өнөөдөр</div>
            <div className="what">2026 II улирлын гэрээ — гарын үсэг хүлээж буй</div>
          </div>
          <div className="tl-item done">
            <div className="when">2026-04-01</div>
            <div className="what">2026 II улирлын төлбөр баталгаажсан</div>
          </div>
          <div className="tl-item done">
            <div className="when">2025-09-01</div>
            <div className="what">2025-2026 оны сургалтын жилийн анхны гэрээ зурагдсан</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

window.ContractScreen = ContractScreen;
