// layout.jsx — App shell, header, sidebar, mobile bottom nav

const NAV_ITEMS = [
  { key: "dashboard", labelKey: "nav_dashboard", icon: <IcHome size={16}/>,     roles: "*" },
  { key: "booking",   labelKey: "nav_booking",   icon: <IcBed size={16}/>,      roles: ["student"] },
  { key: "payment",   labelKey: "nav_payment",   icon: <IcWallet size={16}/>,   roles: "*" },
  { key: "contract",  labelKey: "nav_contract",  icon: <IcContract size={16}/>, roles: "*" },
  { key: "daily",     labelKey: "nav_daily",     icon: <IcCalendar size={16}/>, roles: "*" },
  { key: "admin",     labelKey: "nav_admin",     icon: <IcShield size={16}/>,   roles: ["staff", "accountant", "admin"] },
  { key: "reports",   labelKey: "nav_reports",   icon: <IcChart size={16}/>,    roles: ["accountant", "admin"] },
  { key: "tokens",    labelKey: "nav_tokens",    icon: <IcLayers size={16}/>,   roles: "*" },
];

function visibleNav(role) {
  return NAV_ITEMS.filter(n => n.roles === "*" || n.roles.includes(role));
}

function Brand({ t }) {
  return (
    <div className="brand">
      <div className="brand-mark">D</div>
      <div>
        <div>{t("appName")} · {t("universityShort")}</div>
        <div className="brand-meta">{t("appSub")}</div>
      </div>
    </div>
  );
}

function Header({ t, route, setRoute, role, setRole, lang, setLang, dark, setDark, navStyle, onLogout, onMobileMenu }) {
  const items = visibleNav(role);
  const roleOpts = [
    { value: "student",   label: t("role_student") },
    { value: "staff",     label: t("role_staff") },
    { value: "accountant",label: t("role_accountant") },
    { value: "admin",     label: t("role_admin") },
  ];
  const me = role === "student" ? MOCK.students[0] : { name: "О. Хүлэг", email: "khuleg@university.edu" };
  const initials = me.name.split(/\s+/).slice(0, 2).map(w => w[0]).join("");

  return (
    <header className="app-header">
      <button className="btn btn-ghost btn-icon menu-trigger" onClick={onMobileMenu} aria-label="Menu">
        <IcMenu size={18}/>
      </button>
      <Brand t={t}/>
      {navStyle === "topnav" && (
        <nav className="nav-top">
          {items.map(n => (
            <a key={n.key} className={route === n.key ? "active" : ""} onClick={() => setRoute(n.key)}>
              {n.icon}{t(n.labelKey)}
            </a>
          ))}
        </nav>
      )}
      <div className="header-right">
        {/* role switcher */}
        <Dropdown trigger={
          <button className="btn btn-secondary btn-sm" title="Role">
            <IcShield size={14}/> {t(`role_${role}`)}
          </button>
        }>
          {(close) => (
            <>
              <div className="menu-meta">Demo: эрх солих</div>
              {roleOpts.map(o => (
                <div key={o.value} className="menu-item" onClick={() => { setRole(o.value); close(); }}>
                  <IcUser size={14}/> {o.label}
                  {o.value === role && <span style={{ marginLeft: "auto", color: "var(--primary)" }}><IcCheck size={14}/></span>}
                </div>
              ))}
            </>
          )}
        </Dropdown>

        {/* language */}
        <button className="btn btn-ghost btn-sm" onClick={() => setLang(lang === "mn" ? "en" : "mn")} title="Language">
          <IcGlobe size={14}/> {lang === "mn" ? "MN" : "EN"}
        </button>

        {/* dark toggle */}
        <button className="btn btn-ghost btn-icon" onClick={() => setDark(!dark)} aria-label="Theme">
          <IcMoon size={16}/>
        </button>

        {/* notifications */}
        <Dropdown trigger={
          <button className="btn btn-ghost btn-icon" aria-label="Notifications">
            <span style={{ position: "relative", display: "inline-flex" }}>
              <IcBell size={16}/>
              <span style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: 999, background: "var(--err-500)" }}/>
            </span>
          </button>
        }>
          <div className="menu-meta">Мэдэгдэл</div>
          <div className="menu-item"><IcInfo size={14}/><div><div style={{ fontSize: 13 }}>Гэрээ хүлээгдэж байна</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>3 өдрийн дотор</div></div></div>
          <div className="menu-item"><IcCheck size={14} style={{ color: "var(--ok-500)" }}/><div><div style={{ fontSize: 13 }}>Төлбөр амжилттай</div><div style={{ fontSize: 11, color: "var(--text-muted)" }}>1 цагийн өмнө</div></div></div>
          <div className="menu-sep"/>
          <div className="menu-item">Бүгдийг үзэх</div>
        </Dropdown>

        {/* profile */}
        <Dropdown trigger={
          <button className="btn btn-ghost" style={{ height: 40, padding: "0 6px 0 6px", gap: 8 }}>
            <span className="avatar">{initials}</span>
          </button>
        }>
          {(close) => (
            <>
              <div style={{ padding: "10px 10px 6px" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{me.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{me.email}</div>
                <div style={{ marginTop: 6 }}><Badge tone="brand">{t(`role_${role}`)}</Badge></div>
              </div>
              <div className="menu-sep"/>
              <div className="menu-item" onClick={close}><IcUser size={14}/> Профайл</div>
              <div className="menu-item" onClick={close}><IcSettings size={14}/> Тохиргоо</div>
              <div className="menu-sep"/>
              <div className="menu-item danger" onClick={() => { close(); onLogout(); }}>
                <IcLogout size={14}/> Гарах
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}

function Sidebar({ t, route, setRoute, role }) {
  const items = visibleNav(role);
  const counts = { booking: 0, daily: 2, admin: 12, payment: role === "student" ? 1 : null };
  return (
    <aside className="sidebar">
      <div className="side-section">Цэс</div>
      <nav className="nav-side">
        {items.map(n => (
          <a key={n.key} className={route === n.key ? "active" : ""} onClick={() => setRoute(n.key)}>
            {n.icon}<span>{t(n.labelKey)}</span>
            {counts[n.key] ? <span className="count">{counts[n.key]}</span> : null}
          </a>
        ))}
      </nav>
      <div className="spacer" style={{ flex: 1 }}/>
      <div style={{
        padding: 12, marginTop: "auto",
        borderRadius: "var(--r)", background: "var(--bg-muted)",
        fontSize: 11, color: "var(--text-muted)"
      }}>
        <div style={{ fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>Тусламж хэрэгтэй?</div>
        Дотуур байрны оператортой холбогдох:
        <div style={{ marginTop: 6, fontFamily: "var(--font-mono)", color: "var(--text)" }}>+976 7700-DDMS</div>
      </div>
    </aside>
  );
}

function BottomNav({ t, route, setRoute, role }) {
  const items = visibleNav(role).slice(0, 5);
  return (
    <nav className="bottom-nav">
      {items.map(n => (
        <a key={n.key} className={route === n.key ? "active" : ""} onClick={() => setRoute(n.key)}>
          {n.icon}<span>{t(n.labelKey)}</span>
        </a>
      ))}
    </nav>
  );
}

function PageHeader({ crumbs, title, sub, action }) {
  return (
    <div className="page-hd">
      {crumbs && (
        <div className="crumbs">
          {crumbs.map((c, i) => <React.Fragment key={i}>{i > 0 && <span>·</span>}<span>{c}</span></React.Fragment>)}
        </div>
      )}
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

Object.assign(window, { Header, Sidebar, BottomNav, PageHeader, NAV_ITEMS, visibleNav });
