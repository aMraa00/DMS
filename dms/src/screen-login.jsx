// screen-login.jsx — Three-tab glassmorphism login

function LoginScreen({ t, lang, setLang, onLogin, glass = "soft", primary }) {
  const [tab, setTab] = React.useState("west");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState(null);

  // Per-tab form state
  const [west, setWest] = React.useState({ loginName: "", password: "" });
  const [email, setEmail] = React.useState({ email: "", password: "" });
  const [reg, setReg] = React.useState({ studentId: "", fullname: "", email: "", password: "", gender: "male" });
  const [errs, setErrs] = React.useState({});

  const validateWest = () => {
    const e = {};
    if (!west.loginName) e.loginName = t("err_required");
    if (!west.password) e.password = t("err_required");
    setErrs(e);
    return !Object.keys(e).length;
  };
  const validateEmail = () => {
    const e = {};
    if (!email.email) e.email = t("err_required");
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.email)) e.email = t("err_invalid_email");
    if (!email.password) e.password = t("err_required");
    else if (email.password.length < 8) e.password = t("err_short_password");
    setErrs(e);
    return !Object.keys(e).length;
  };
  const validateReg = () => {
    const e = {};
    if (!reg.studentId) e.studentId = t("err_required");
    if (!reg.fullname) e.fullname = t("err_required");
    if (!reg.email) e.email = t("err_required");
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(reg.email)) e.email = t("err_invalid_email");
    if (!reg.password) e.password = t("err_required");
    else if (reg.password.length < 8) e.password = t("err_short_password");
    setErrs(e);
    return !Object.keys(e).length;
  };

  const submit = (e) => {
    e.preventDefault();
    setErr(null);
    let ok = false, role = "student";
    if (tab === "west") ok = validateWest();
    if (tab === "email") {
      ok = validateEmail();
      if (ok && (email.email !== "admin@dms.demo" || email.password !== "Demo123456!")) {
        setErr(t("err_login")); return;
      }
      if (ok) role = "admin";
    }
    if (tab === "register") ok = validateReg();
    if (!ok) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onLogin({ role }); }, 600);
  };

  const tabs = [
    { value: "west",     label: t("login_tab_west"),     icon: <IcKey size={14}/> },
    { value: "email",    label: t("login_tab_email"),    icon: <IcMail size={14}/> },
    { value: "register", label: t("login_tab_register"), icon: <IcUser size={14}/> },
  ];

  return (
    <div className="login-stage" data-glass={glass}>
      <div className="login-bg-shapes">
        <div className="blob b1"/><div className="blob b2"/><div className="blob b3"/>
        {glass === "geometric" && (
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: .35 }} aria-hidden="true">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
        )}
      </div>

      {/* top-right: language */}
      <div style={{ position: "absolute", top: 22, right: 22, zIndex: 3, display: "flex", gap: 8 }}>
        <button onClick={() => setLang(lang === "mn" ? "en" : "mn")}
          style={{ background: "rgba(255,255,255,.12)", color: "white",
                  border: "1px solid rgba(255,255,255,.22)", borderRadius: 999,
                  height: 34, padding: "0 14px", fontSize: 12, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit",
                  backdropFilter: "blur(10px)" }}>
          <IcGlobe size={14}/> {lang === "mn" ? "Монгол" : "English"}
        </button>
      </div>

      <div className="login-shell">
        <div className="login-hero">
          <div className="eyebrow"><span className="dot" style={{ background: "#7ee0ff" }}/> {t("universityShort").toUpperCase()} · DMS</div>
          <h1>{t("login_title")}</h1>
          <p>{t("login_lead")}</p>
          <ul>
            <li><span className="check"><IcCheck size={11}/></span>{t("login_perk_1")}</li>
            <li><span className="check"><IcCheck size={11}/></span>{t("login_perk_2")}</li>
            <li><span className="check"><IcCheck size={11}/></span>{t("login_perk_3")}</li>
          </ul>
        </div>

        <form className="glass-card" onSubmit={submit} noValidate>
          <h2>{t("login_card_title")}</h2>
          <div className="lead">{t("login_card_sub")}</div>
          <div style={{ marginBottom: 18 }}>
            <Tabs tabs={tabs} value={tab} onChange={(v) => { setTab(v); setErrs({}); setErr(null); }}/>
          </div>

          {err && <div className="err-box" style={{ marginBottom: 14 }}><IcAlert size={14}/> {err}</div>}

          {tab === "west" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="info-box" style={{ background: "rgba(245, 158, 11, .14)", borderColor: "rgba(245, 158, 11, .45)", color: "#fde6b8" }}>
                <div style={{ fontWeight: 600, marginBottom: 2, color: "#fff" }}>{t("west_warn_title")}</div>
                {t("west_warn_msg")}
              </div>
              <Input label={t("f_loginName")} placeholder={t("f_loginName_ph")}
                     value={west.loginName} onChange={(e) => setWest({ ...west, loginName: e.target.value })}
                     error={errs.loginName} required lead={<IcUser size={14}/>}/>
              <Input label={t("f_password")} type="password" placeholder={t("f_password_ph")}
                     value={west.password} onChange={(e) => setWest({ ...west, password: e.target.value })}
                     error={errs.password} required lead={<IcLock size={14}/>}/>
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                {busy ? "..." : t("btn_login")} <IcArrow size={16}/>
              </button>
            </div>
          )}

          {tab === "email" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="info-box">
                <div style={{ fontWeight: 600, marginBottom: 4, color: "#fff" }}>{t("email_demo_title")}</div>
                <div>{t("email_demo_msg")}<br/>
                  <span className="k">admin@dms.demo</span> &nbsp;/&nbsp; <span className="k">Demo123456!</span>
                </div>
              </div>
              <Input label={t("f_email")} type="email" placeholder={t("f_email_ph")}
                     value={email.email} onChange={(e) => setEmail({ ...email, email: e.target.value })}
                     error={errs.email} required lead={<IcMail size={14}/>}/>
              <Input label={t("f_password")} type="password" placeholder={t("f_password_ph")}
                     value={email.password} onChange={(e) => setEmail({ ...email, password: e.target.value })}
                     error={errs.password} required lead={<IcLock size={14}/>}/>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: "rgba(255,255,255,.78)", cursor: "pointer" }}>
                  <input type="checkbox" /> Намайг сана
                </label>
                <a style={{ fontSize: 12, color: "rgba(255,255,255,.85)", borderBottom: "1px dashed rgba(255,255,255,.4)" }}>{t("btn_forgot")}</a>
              </div>
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                {busy ? "..." : t("btn_login")} <IcArrow size={16}/>
              </button>
            </div>
          )}

          {tab === "register" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label={t("f_studentId")} placeholder={t("f_studentId_ph")}
                       value={reg.studentId} onChange={(e) => setReg({ ...reg, studentId: e.target.value })}
                       error={errs.studentId} required/>
                <div className="field">
                  <label className="field-label">{t("f_gender")}</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["male", t("f_male")], ["female", t("f_female")], ["other", t("f_other")]].map(([v, l]) => (
                      <button key={v} type="button" onClick={() => setReg({ ...reg, gender: v })}
                        style={{
                          flex: 1, height: "calc(44px * var(--density))",
                          borderRadius: "var(--r)", fontFamily: "inherit", fontSize: 12,
                          color: reg.gender === v ? "var(--brand-700)" : "rgba(255,255,255,.85)",
                          background: reg.gender === v ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.08)",
                          border: "1px solid " + (reg.gender === v ? "transparent" : "rgba(255,255,255,.22)"),
                          cursor: "pointer"
                        }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <Input label={t("f_fullname")} placeholder={t("f_fullname_ph")}
                     value={reg.fullname} onChange={(e) => setReg({ ...reg, fullname: e.target.value })}
                     error={errs.fullname} required lead={<IcUser size={14}/>}/>
              <Input label={t("f_email")} type="email" placeholder={t("f_email_ph")}
                     value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })}
                     error={errs.email} required lead={<IcMail size={14}/>}/>
              <Input label={t("f_password_new")} type="password" placeholder={t("f_password_new_ph")}
                     value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })}
                     error={errs.password} hint={!errs.password && "8+ тэмдэгт, том/жижиг үсэг ба тоо"} required lead={<IcLock size={14}/>}/>
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                {busy ? "..." : t("btn_register")} <IcArrow size={16}/>
              </button>
            </div>
          )}

          <div className="glass-foot">
            <span>auth.university.edu</span>
            <span>v1.0 · {t("universityFull")}</span>
          </div>
        </form>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
