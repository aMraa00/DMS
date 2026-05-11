// screen-booking.jsx — 5-step room booking wizard

function BookingScreen({ t, push }) {
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    building: null, floor: null, room: null,
    priority: 3,
    note: "",
    roommates: "",
    confirmed: false,
  });

  const steps = [
    { key: "building", label: t("step_building") },
    { key: "floor",    label: t("step_floor") },
    { key: "room",     label: t("step_room") },
    { key: "priority", label: t("step_priority") },
    { key: "review",   label: t("step_review") },
  ];

  const canNext =
    (step === 0 && data.building) ||
    (step === 1 && data.floor) ||
    (step === 2 && data.room) ||
    (step === 3 && data.priority) ||
    (step === 4 && data.confirmed);

  const submit = () => {
    push({ tone: "ok", title: "Хүсэлт амжилттай илгээгдлээ", message: `${data.building.code} · ${data.floor}-р давхар · Өрөө ${data.room}` });
    setStep(0);
    setData({ building: null, floor: null, room: null, priority: 3, note: "", roommates: "", confirmed: false });
  };

  return (
    <div>
      <PageHeader crumbs={[t("nav_booking"), `${step + 1}/${steps.length}`]} title={t("booking_title")} sub={t("booking_sub")}/>

      <Card padless>
        <div style={{ padding: "20px 24px 0" }}>
          <Stepper steps={steps} current={step}/>
        </div>
        <div style={{ padding: 24, paddingTop: 0 }}>
          {step === 0 && <StepBuilding data={data} setData={setData}/>}
          {step === 1 && <StepFloor data={data} setData={setData}/>}
          {step === 2 && <StepRoom data={data} setData={setData}/>}
          {step === 3 && <StepPriority t={t} data={data} setData={setData}/>}
          {step === 4 && <StepReview t={t} data={data} setData={setData}/>}
        </div>
        <div className="card-ft">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)} icon={<IcArrowL size={14}/>}>
            {t("btn_back")}
          </Button>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Алхам {step + 1} / {steps.length}
          </div>
          {step < steps.length - 1 ? (
            <Button variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
              {t("btn_next")} <IcArrow size={14}/>
            </Button>
          ) : (
            <Button variant="primary" disabled={!canNext} onClick={submit}>
              {t("btn_submit")} <IcCheck size={14}/>
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function StepBuilding({ data, setData }) {
  return (
    <div>
      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 600 }}>Байр сонгох</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0, marginBottom: 18 }}>
        Хүйс, өрөөний хүний тоо болон сул байгаа өрөөний тоо зэргийг харгалзан үзнэ үү.
      </p>
      <div className="grid grid-2 choice-grid">
        {MOCK.buildings.map(b => (
          <div key={b.id} className="choice" aria-selected={data.building?.id === b.id}
               onClick={() => setData({ ...data, building: b, floor: null, room: null })}>
            <div className="ic"><IcBuilding size={18}/></div>
            <div style={{ flex: 1 }}>
              <div className="ttl">{b.name} <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 13 }}>· {b.code}</span></div>
              <div className="meta">{b.beds}</div>
              <div style={{ marginTop: 10, display: "flex", gap: 14, fontSize: 12, color: "var(--text-muted)" }}>
                <span><b style={{ color: "var(--text)" }}>{b.floors}</b> давхар</span>
                <span><b style={{ color: "var(--text)" }}>{b.total}</b> орон</span>
                <span><b style={{ color: b.available < 10 ? "var(--err-500)" : "var(--ok-500)" }}>{b.available}</b> сул</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepFloor({ data, setData }) {
  if (!data.building) return null;
  const floors = Array.from({ length: data.building.floors }, (_, i) => i + 1);
  return (
    <div>
      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 600 }}>Давхар сонгох — {data.building.name}</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0, marginBottom: 18 }}>
        Доод давхар нь үүд хаалга, хооланд ойр; дээд давхрууд илүү чимээ багатай.
      </p>
      <div className="grid grid-3 choice-grid">
        {floors.map(f => {
          const avail = Math.max(2, Math.round(Math.sin(f * 1.7) * 6 + 8));
          return (
            <div key={f} className="choice" aria-selected={data.floor === f}
                 onClick={() => setData({ ...data, floor: f, room: null })}>
              <div className="ic"><span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{f}</span></div>
              <div style={{ flex: 1 }}>
                <div className="ttl">{f}-р давхар</div>
                <div className="meta">{avail} сул өрөө · {data.building.rooms_per_floor} нийт</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepRoom({ data, setData }) {
  if (!data.floor) return null;
  const rooms = React.useMemo(() => {
    const out = [];
    const cnt = data.building.rooms_per_floor;
    const seed = data.floor * 13;
    for (let i = 0; i < cnt; i++) {
      const num = `${data.floor}${(i + 1).toString().padStart(2, "0")}`;
      const sub = String.fromCharCode(65 + (i % 4));
      const code = num + sub;
      const occ = (seed + i * 7) % 5;
      let status = "avail";
      if (occ === 0) status = "full";
      else if (occ === 4) status = "taken";
      out.push({ code, occ: occ === 0 ? 4 : occ, status });
    }
    return out;
  }, [data.building, data.floor]);

  return (
    <div>
      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 600 }}>
        Өрөө сонгох — {data.building.name}, {data.floor}-р давхар
      </h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0, marginBottom: 14 }}>
        Сул орон бүхий өрөөг сонгоно уу. Дугуй өнгө: <span style={{ color: "var(--ok-500)" }}>● сул</span>{" "}
        <span style={{ color: "var(--err-500)" }}>● дүүрэн</span>{" "}
        <span style={{ color: "var(--text-muted)" }}>● зөвшөөрөгдөөгүй</span>
      </p>
      <div className="room-grid" style={{ marginBottom: 18 }}>
        {rooms.map(r => (
          <div key={r.code} className={`room ${r.status}`}
               aria-selected={data.room === r.code}
               onClick={r.status === "avail" ? () => setData({ ...data, room: r.code }) : undefined}>
            <div className="name">{r.code}</div>
            <div className="occ">
              {r.status === "taken" ? "Дүүрэн" : `${r.occ}/4 хүн`}
            </div>
          </div>
        ))}
      </div>
      <Input label="Хамт байх найзын ID (заавал биш)" placeholder="B210123456, B220987654"
             value={data.roommates} onChange={(e) => setData({ ...data, roommates: e.target.value })}
             hint="Зөвхөн хоёр тал нь нэгэн адил хүсэлт гаргавал найзлагдана."/>
    </div>
  );
}

function StepPriority({ t, data, setData }) {
  const opts = [1, 2, 3, 4, 5];
  return (
    <div>
      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 600 }}>Эрэмбэ ба тэмдэглэл</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0, marginBottom: 18 }}>
        Эрэмбэ өндөр байх тусам админ түрүүнд авч үзэх боломжтой. Та дараа нь өөрчилж болно.
      </p>
      <div className="grid grid-3 choice-grid" style={{ marginBottom: 18 }}>
        {opts.map(p => (
          <div key={p} className="choice" aria-selected={data.priority === p}
               onClick={() => setData({ ...data, priority: p })}
               style={{ alignItems: "center" }}>
            <div className="ic"><IcStar size={16}/></div>
            <div style={{ flex: 1 }}>
              <div className="ttl">{priorityLabel(p)}</div>
              <div className="meta">Түвшин {p}/5</div>
            </div>
          </div>
        ))}
      </div>
      <div className="field">
        <label className="field-label">Нэмэлт тэмдэглэл</label>
        <textarea className="input" placeholder="Эрүүл мэндийн нөхцөл, аллерги, тусгай хүсэлт..."
                  value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })}/>
      </div>
    </div>
  );
}

function StepReview({ t, data, setData }) {
  const summary = [
    ["Байр",     `${data.building.name} (${data.building.code})`],
    ["Давхар",   `${data.floor}-р давхар`],
    ["Өрөө",     data.room],
    ["Хүний тоо",data.building.beds],
    ["Эрэмбэ",   priorityLabel(data.priority)],
    ["Хамтрагч", data.roommates || "—"],
    ["Тэмдэглэл",data.note || "—"],
  ];
  return (
    <div>
      <h3 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 600 }}>Хянаж илгээх</h3>
      <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 0, marginBottom: 18 }}>
        Дараах мэдээлэл админ луу илгээгдэнэ. Батлагдсаны дараа гэрээ зурах шат руу шилжинэ.
      </p>
      <div className="card flat" style={{ background: "var(--surface-2)", borderRadius: "var(--r-md)", overflow: "hidden", marginBottom: 18 }}>
        <table className="table">
          <tbody>
            {summary.map(([k, v]) => (
              <tr key={k}>
                <td style={{ width: 180, color: "var(--text-muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>{k}</td>
                <td style={{ fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", padding: "12px 14px", border: "1px solid var(--border-strong)", borderRadius: "var(--r)", background: "var(--surface)" }}>
        <input type="checkbox" checked={data.confirmed} onChange={(e) => setData({ ...data, confirmed: e.target.checked })}
               style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--primary)" }}/>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Дотуур байрны журамтай танилцсан</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 3 }}>
            Орох/гарах цаг, зочин хүлээн авах журам, гадны хүн оруулахгүй байх зэргийг ойлгож, дагаж мөрдөхийг зөвшөөрч байна.
          </div>
        </div>
      </label>
    </div>
  );
}

window.BookingScreen = BookingScreen;
