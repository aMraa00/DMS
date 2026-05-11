// ui.jsx — Reusable UI primitives

// Button
const Button = ({ variant = "primary", size, block, icon, children, ...rest }) => {
  const cls = ["btn", `btn-${variant}`, size && `btn-${size}`, block && "btn-block"].filter(Boolean).join(" ");
  return <button className={cls} {...rest}>{icon}{children}</button>;
};

// Input
const Input = React.forwardRef(({ label, hint, error, required, lead, id, ...rest }, ref) => {
  const _id = id || React.useId();
  return (
    <div className="field">
      {label && <label htmlFor={_id} className="field-label">{label}{required && <span className="req">*</span>}</label>}
      {lead ? (
        <div className="input-wrap">
          <span className="iLead">{lead}</span>
          <input ref={ref} id={_id} className="input" aria-invalid={error ? "true" : "false"} {...rest} />
        </div>
      ) : (
        <input ref={ref} id={_id} className="input" aria-invalid={error ? "true" : "false"} {...rest} />
      )}
      {error ? <div className="field-error"><IcAlert size={12}/> {error}</div>
             : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
});

// Select
const Select = ({ label, options = [], value, onChange, hint, error, required, id }) => {
  const _id = id || React.useId();
  return (
    <div className="field">
      {label && <label htmlFor={_id} className="field-label">{label}{required && <span className="req">*</span>}</label>}
      <select id={_id} className="input" value={value} onChange={(e)=>onChange(e.target.value)} style={{ paddingRight: 28 }}>
        {options.map((o) => typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error ? <div className="field-error"><IcAlert size={12}/> {error}</div>
             : hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
};

// Card
const Card = ({ title, sub, action, children, footer, padless, className = "" }) => (
  <div className={`card ${className}`}>
    {(title || action) && (
      <div className="card-hd">
        <div>
          {title && <h3>{title}</h3>}
          {sub && <div className="sub">{sub}</div>}
        </div>
        {action}
      </div>
    )}
    {children && <div className={padless ? "" : (title ? "card-bd" : "card-pad")}>{children}</div>}
    {footer && <div className="card-ft">{footer}</div>}
  </div>
);

// Tabs
const Tabs = ({ tabs, value, onChange, variant = "" }) => (
  <div className={`tabs ${variant === "line" ? "tabs-line" : ""}`}>
    {tabs.map((t) => (
      <button key={t.value} className="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
        {t.icon}{t.label}
      </button>
    ))}
  </div>
);

// Badge
const Badge = ({ tone = "default", children, dot }) => (
  <span className={`badge ${tone}`}>{dot && <span className="dot"/>}{children}</span>
);

// Toast system
const ToastCtx = React.createContext(() => {});
const useToast = () => React.useContext(ToastCtx);

function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((opts) => {
    const id = Math.random().toString(36).slice(2);
    const item = { id, tone: "default", ttl: 3500, ...opts };
    setItems((s) => [...s, item]);
    setTimeout(() => {
      setItems((s) => s.map(x => x.id === id ? { ...x, exit: true } : x));
      setTimeout(() => setItems((s) => s.filter(x => x.id !== id)), 220);
    }, item.ttl);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone} ${t.exit ? "exit" : ""}`}>
            <div style={{ marginTop: 1, color: t.tone === "ok" ? "var(--ok-500)" : t.tone === "err" ? "var(--err-500)" : t.tone === "warn" ? "var(--warn-500)" : "var(--primary)" }}>
              {t.tone === "ok" ? <IcCheck size={16}/> : t.tone === "err" ? <IcAlert size={16}/> : t.tone === "warn" ? <IcAlert size={16}/> : <IcInfo size={16}/>}
            </div>
            <div style={{ flex: 1 }}>
              <div className="ttl">{t.title}</div>
              {t.message && <div className="msg">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// Empty state
const Empty = ({ title, message, action }) => (
  <div className="empty">
    <div className="ttl">{title}</div>
    {message && <div style={{ fontSize: "var(--t-sm)" }}>{message}</div>}
    {action && <div style={{ marginTop: 14 }}>{action}</div>}
  </div>
);

// Skeleton
const Skel = ({ w = "100%", h = 14, r, style }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

// Dropdown
function Dropdown({ trigger, children, align = "right" }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="dropdown" ref={ref}>
      {React.cloneElement(trigger, { onClick: (e) => { e.stopPropagation(); setOpen(o => !o); } })}
      {open && (
        <div className="dropdown-menu" style={{ left: align === "left" ? 0 : "auto", right: align === "right" ? 0 : "auto" }}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

// Sortable table
function SortableTable({ columns, rows, initialSort, rowKey = "id", onRowClick }) {
  const [sort, setSort] = React.useState(initialSort || { key: columns[0].key, dir: "asc" });
  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (typeof va === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return arr;
  }, [rows, sort]);

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.right ? "right" : ""}
                  data-sortable={c.sortable !== false ? "" : null}
                  onClick={c.sortable === false ? null : () =>
                    setSort((s) => ({ key: c.key, dir: s.key === c.key && s.dir === "asc" ? "desc" : "asc" }))}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {c.label}
                  {c.sortable !== false && sort.key === c.key && (
                    <span style={{ fontSize: 9, color: "var(--primary)" }}>{sort.dir === "asc" ? "▲" : "▼"}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r[rowKey]} onClick={onRowClick ? () => onRowClick(r) : null}
                style={{ cursor: onRowClick ? "pointer" : "default" }}>
              {columns.map((c) => (
                <td key={c.key} className={c.right ? "right" : ""}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stepper
function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s.key || i} className={`step ${i < current ? "done" : ""} ${i === current ? "active" : ""}`}>
          <div className="num">{i < current ? <IcCheck size={14}/> : i + 1}</div>
          <div>{s.label}</div>
          {i < steps.length - 1 && <div className="bar" />}
        </div>
      ))}
    </div>
  );
}

// Stat card
const Stat = ({ label, value, delta, deltaTone, accent, children }) => (
  <div className={`stat-card ${accent ? "feat" : ""}`}>
    <div className="lbl">{label}</div>
    <div className="val">{value}</div>
    {delta && <div className={`delta ${deltaTone || ""}`}>{delta}</div>}
    {children}
  </div>
);

Object.assign(window, { Button, Input, Select, Card, Tabs, Badge, ToastProvider, useToast, Empty, Skel, Dropdown, SortableTable, Stepper, Stat });
