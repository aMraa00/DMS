// screen-daily.jsx — Daily services (guest, leave, move-out, complaints, property)

function DailyScreen({ t, push }) {
  const [tab, setTab] = React.useState("guest");
  const tabs = [
    { value: "guest",     label: t("daily_guest"),     icon: <IcUser size={14}/> },
    { value: "leave",     label: t("daily_leave"),     icon: <IcCalendar size={14}/> },
    { value: "moveout",   label: t("daily_moveout"),   icon: <IcDoor size={14}/> },
    { value: "complaint", label: t("daily_complaint"), icon: <IcAlert size={14}/> },
    { value: "property",  label: t("daily_property"),  icon: <IcLayers size={14}/> },
  ];

  return (
    <div>
      <PageHeader crumbs={[t("nav_daily")]} title={t("daily_title")} sub="Зочин, түр чөлөө, гарах хүсэлт, санал гомдол, эд хогшил."/>

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} variant="line"/>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1.2fr", gap: 24 }}>
        <Card title={tabs.find(x => x.value === tab).label + " — шинэ хүсэлт"} sub="Маягт бөглөж илгээнэ үү">
          {tab === "guest"     && <GuestForm push={push}/>}
          {tab === "leave"     && <LeaveForm push={push}/>}
          {tab === "moveout"   && <MoveoutForm push={push}/>}
          {tab === "complaint" && <ComplaintForm push={push}/>}
          {tab === "property"  && <PropertyForm push={push}/>}
        </Card>

        <Card title="Миний хүсэлтүүд" sub={`${MOCK.dailyRequests.length} нийт`}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MOCK.dailyRequests.map(r => (
              <div key={r.id} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 32, height: 32, borderRadius: "var(--r-sm)", background: "var(--primary-soft)", color: "var(--primary)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                  {r.type === "Зочин" ? <IcUser size={14}/> : r.type === "Түр чөлөө" ? <IcCalendar size={14}/> :
                   r.type === "Санал гомдол" ? <IcAlert size={14}/> : r.type === "Эд хогшил" ? <IcLayers size={14}/> : <IcDoor size={14}/>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}>{r.id}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{r.type} · {r.when}</div>
                </div>
                <Badge tone={
                  r.status === "approved" ? "ok" : r.status === "pending" ? "warn" :
                  r.status === "in-review" ? "info" : "default"
                } dot>
                  {r.status === "approved" ? "Зөвшөөрсөн" : r.status === "pending" ? "Хүлээгдэж буй" :
                   r.status === "in-review" ? "Хянагдаж байна" : "Ноорог"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function GuestForm({ push }) {
  const [data, setData] = React.useState({ name: "", relation: "Эцэг эх", date: "", time: "14:00", phone: "", note: "" });
  const submit = (e) => { e.preventDefault(); push({ tone: "ok", title: "Зочны хүсэлт илгээгдлээ", message: "Шөнө орохгүй гэдгийг анхаарна уу — 20:00-аас өмнө буцаана." }); };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="banner">
        <IcInfo size={16}/>
        <div>
          <div className="ttl">Зочин 20:00-аас өмнө гарна</div>
          <div className="msg">Дотуур байрны журмын дагуу зочин шөнөжин үлдэх боломжгүй.</div>
        </div>
      </div>
      <div className="grid grid-2">
        <Input label="Зочны нэр" required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} lead={<IcUser size={14}/>}/>
        <Select label="Хамаарал" value={data.relation} onChange={(v) => setData({ ...data, relation: v })}
                options={["Эцэг эх", "Ах эгч/Дүү", "Найз", "Бусад"]}/>
      </div>
      <div className="grid grid-2">
        <Input label="Огноо" type="date" required value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })}/>
        <Input label="Цаг" type="time" required value={data.time} onChange={(e) => setData({ ...data, time: e.target.value })}/>
      </div>
      <Input label="Утас" type="tel" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })}
             placeholder="+976 9999 9999" hint="Шаардлагатай үед холбогдох"/>
      <div className="field">
        <label className="field-label">Нэмэлт тэмдэглэл</label>
        <textarea className="input" placeholder="Зочны зорилго, тусгай хэрэгцээ" value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })}/>
      </div>
      <Button variant="primary" type="submit" icon={<IcCheck size={14}/>}>Хүсэлт илгээх</Button>
    </form>
  );
}

function LeaveForm({ push }) {
  const [data, setData] = React.useState({ from: "", to: "", reason: "Гэр бүлийн ажил", note: "" });
  const days = data.from && data.to ? Math.max(0, (new Date(data.to) - new Date(data.from)) / 86400000 + 1) : 0;
  const submit = (e) => { e.preventDefault(); push({ tone: "ok", title: "Түр чөлөөний хүсэлт илгээгдлээ", message: `${days} өдрийн чөлөө хүлээгдэж байна` }); };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="banner">
        <IcInfo size={16}/>
        <div><div className="ttl">Түр чөлөө 1-3 өдөр</div><div className="msg">3 өдрөөс дээш бол гарах хүсэлт өргөдөн ачаа аваад явна.</div></div>
      </div>
      <div className="grid grid-2">
        <Input label="Эхлэх огноо" type="date" required value={data.from} onChange={(e) => setData({ ...data, from: e.target.value })}/>
        <Input label="Дуусах огноо" type="date" required value={data.to} onChange={(e) => setData({ ...data, to: e.target.value })}
               error={days > 3 ? "3 өдрөөс хэтрэх боломжгүй" : null}/>
      </div>
      <Select label="Шалтгаан" value={data.reason} onChange={(v) => setData({ ...data, reason: v })}
              options={["Гэр бүлийн ажил", "Эрүүл мэнд", "Сурлагатай холбоотой", "Бусад"]}/>
      <div className="field">
        <label className="field-label">Тайлбар</label>
        <textarea className="input" value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })}/>
      </div>
      <Button variant="primary" type="submit" disabled={!data.from || !data.to || days > 3} icon={<IcCheck size={14}/>}>
        Илгээх ({days || 0} өдөр)
      </Button>
    </form>
  );
}

function MoveoutForm({ push }) {
  const [data, setData] = React.useState({ date: "", reason: "Хичээлийн жил дуусах", returnKey: true });
  const submit = (e) => { e.preventDefault(); push({ tone: "ok", title: "Гарах хүсэлт илгээгдлээ", message: "Админ 7 хоногийн дотор хариулна." }); };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="banner warn">
        <IcAlert size={16}/>
        <div><div className="ttl">7 хоногийн өмнө мэдэгдэх ёстой</div><div className="msg">Эд хогшил буцаах, барьцаа суутгах журмын дагуу хариуцна.</div></div>
      </div>
      <Input label="Гарах огноо" type="date" required value={data.date} onChange={(e) => setData({ ...data, date: e.target.value })}/>
      <Select label="Шалтгаан" value={data.reason} onChange={(v) => setData({ ...data, reason: v })}
              options={["Хичээлийн жил дуусах", "Гэр бүлийн нөхцөл", "Гадаад руу", "Бусад"]}/>
      <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, cursor: "pointer" }}>
        <input type="checkbox" checked={data.returnKey} onChange={(e) => setData({ ...data, returnKey: e.target.checked })}
               style={{ accentColor: "var(--primary)" }}/>
        Гарахдаа түлхүүр болон эд хогшлоо буцаахаа баталгаажуулна
      </label>
      <Button variant="primary" type="submit" disabled={!data.date || !data.returnKey} icon={<IcDoor size={14}/>}>Гарах хүсэлт илгээх</Button>
    </form>
  );
}

function ComplaintForm({ push }) {
  const [data, setData] = React.useState({ category: "Халаалт", priority: "Дунд", desc: "" });
  const submit = (e) => { e.preventDefault(); push({ tone: "ok", title: "Санал гомдол хүлээн авлаа", message: "Хариуцагч 24 цагийн дотор холбогдоно." }); };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid grid-2">
        <Select label="Ангилал" value={data.category} onChange={(v) => setData({ ...data, category: v })}
                options={["Халаалт", "Цахилгаан", "Усан хангамж", "Цэвэрлэгээ", "Хооллолт", "Аюулгүй байдал", "Бусад"]}/>
        <Select label="Зэрэг" value={data.priority} onChange={(v) => setData({ ...data, priority: v })}
                options={["Маш яаралтай", "Яаралтай", "Дунд", "Бага"]}/>
      </div>
      <div className="field">
        <label className="field-label">Дэлгэрэнгүй <span className="req">*</span></label>
        <textarea className="input" rows={5} required value={data.desc} onChange={(e) => setData({ ...data, desc: e.target.value })}
                  placeholder="Юу болсон, хэзээ, хаана, хэр удсан..."/>
      </div>
      <Button variant="primary" type="submit" disabled={!data.desc} icon={<IcAlert size={14}/>}>Илгээх</Button>
    </form>
  );
}

function PropertyForm({ push }) {
  const [data, setData] = React.useState({ item: "Ор / матрас", action: "Засуулах", desc: "" });
  const submit = (e) => { e.preventDefault(); push({ tone: "ok", title: "Эд хогшлын хүсэлт илгээгдлээ" }); };
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid grid-2">
        <Select label="Эд хогшил" value={data.item} onChange={(v) => setData({ ...data, item: v })}
                options={["Ор / матрас", "Ширээ / сандал", "Хувцасны шүүгээ", "Гэрэл", "Тагт / цонх", "Угаалтуур", "Бусад"]}/>
        <Select label="Үйлдэл" value={data.action} onChange={(v) => setData({ ...data, action: v })}
                options={["Засуулах", "Шинээр авах", "Солих", "Шалгуулах"]}/>
      </div>
      <div className="field">
        <label className="field-label">Тайлбар</label>
        <textarea className="input" value={data.desc} onChange={(e) => setData({ ...data, desc: e.target.value })}/>
      </div>
      <Button variant="primary" type="submit" icon={<IcLayers size={14}/>}>Илгээх</Button>
    </form>
  );
}

window.DailyScreen = DailyScreen;
