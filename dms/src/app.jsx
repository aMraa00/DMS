// app.jsx — Main app: routing, role/lang/theme, tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primary": "#0033A0",
  "density": "regular",
  "radius": "default",
  "navStyle": "sidebar",
  "glass": "soft",
  "dark": false,
  "lang": "mn",
  "role": "student"
}/*EDITMODE-END*/;

function applyTheme({ primary, dark, density, radius }) {
  const root = document.documentElement;
  root.setAttribute("data-theme", dark ? "dark" : "light");
  root.setAttribute("data-density", density);
  root.setAttribute("data-radius", radius);
  // Compute hover from primary
  root.style.setProperty("--primary", primary);
  root.style.setProperty("--primary-hover", `color-mix(in oklab, ${primary} 85%, black)`);
  root.style.setProperty("--primary-soft", `color-mix(in oklab, ${primary} 12%, transparent)`);
  root.style.setProperty("--accent", `color-mix(in oklab, ${primary} 50%, #00a3e0)`);
}

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState("login");
  const [auth, setAuth] = React.useState(null); // { role }
  const t = useT(tw.lang);

  // Apply theme + tokens whenever tweaks change
  React.useEffect(() => {
    applyTheme(tw);
  }, [tw.primary, tw.dark, tw.density, tw.radius]);

  // Sync the "active role" view: if signed in, role tweak controls the demo persona
  React.useEffect(() => {
    if (auth) setAuth((a) => ({ ...a, role: tw.role }));
  }, [tw.role]);

  const onLogin = ({ role }) => {
    setAuth({ role });
    setTweak("role", role);
    setRoute("dashboard");
  };
  const onLogout = () => { setAuth(null); setRoute("login"); };

  // Toast wrapper
  const Inner = () => {
    const push = useToast();

    if (!auth) {
      return (
        <LoginScreen
          t={t}
          lang={tw.lang}
          setLang={(l) => setTweak("lang", l)}
          onLogin={onLogin}
          glass={tw.glass}
          primary={tw.primary}
        />
      );
    }

    const role = auth.role;
    const screen = (() => {
      switch (route) {
        case "dashboard": return <DashboardScreen t={t} role={role} setRoute={setRoute} push={push}/>;
        case "booking":   return <BookingScreen t={t} push={push}/>;
        case "payment":   return <PaymentScreen t={t} role={role} push={push}/>;
        case "contract":  return <ContractScreen t={t} role={role} push={push}/>;
        case "daily":     return <DailyScreen t={t} push={push}/>;
        case "admin":     return <AdminScreen t={t} push={push}/>;
        case "reports":   return <ReportsScreen t={t} push={push}/>;
        case "tokens":    return <TokensScreen t={t}/>;
        default:          return <DashboardScreen t={t} role={role} setRoute={setRoute} push={push}/>;
      }
    })();

    return (
      <div className="app-shell">
        <Header
          t={t}
          route={route}
          setRoute={setRoute}
          role={role}
          setRole={(r) => setTweak("role", r)}
          lang={tw.lang}
          setLang={(l) => setTweak("lang", l)}
          dark={tw.dark}
          setDark={(d) => setTweak("dark", d)}
          navStyle={tw.navStyle}
          onLogout={onLogout}
        />
        <div className="app-body">
          {tw.navStyle === "sidebar" && <Sidebar t={t} route={route} setRoute={setRoute} role={role}/>}
          <main className="app-main">{screen}</main>
        </div>
        <BottomNav t={t} route={route} setRoute={setRoute} role={role}/>
      </div>
    );
  };

  return (
    <ToastProvider>
      <Inner/>
      <DMSTweaks tw={tw} setTweak={setTweak} authed={!!auth}/>
    </ToastProvider>
  );
}

function DMSTweaks({ tw, setTweak, authed }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme"/>
      <TweakColor label="Primary" value={tw.primary}
        options={["#0033A0", "#1A4DDB", "#0B7285", "#7A5AE0", "#1F8A5B", "#C2410C"]}
        onChange={(v) => setTweak("primary", v)}/>
      <TweakToggle label="Dark mode" value={tw.dark} onChange={(v) => setTweak("dark", v)}/>

      <TweakSection label="Layout"/>
      <TweakRadio label="Density" value={tw.density}
        options={["compact", "regular", "comfy"]}
        onChange={(v) => setTweak("density", v)}/>
      <TweakRadio label="Corner radius" value={tw.radius}
        options={["sharp", "default", "round"]}
        onChange={(v) => setTweak("radius", v)}/>
      <TweakRadio label="Navigation" value={tw.navStyle}
        options={["sidebar", "topnav"]}
        onChange={(v) => setTweak("navStyle", v)}/>

      <TweakSection label="Login"/>
      <TweakRadio label="Glass intensity" value={tw.glass}
        options={["soft", "intense", "geometric"]}
        onChange={(v) => setTweak("glass", v)}/>

      <TweakSection label="Demo"/>
      <TweakSelect label="Role" value={tw.role}
        options={[
          { value: "student",    label: "Оюутан · Student" },
          { value: "staff",      label: "Ажилтан · Staff" },
          { value: "accountant", label: "Санхүү · Accountant" },
          { value: "admin",      label: "Админ · Admin" }
        ]}
        onChange={(v) => setTweak("role", v)}/>
      <TweakRadio label="Language" value={tw.lang}
        options={["mn", "en"]}
        onChange={(v) => setTweak("lang", v)}/>
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
