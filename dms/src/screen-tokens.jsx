// screen-tokens.jsx — Design system display

function TokensScreen({ t }) {
  return (
    <div>
      <PageHeader crumbs={[t("nav_tokens")]} title={t("tokens_title")} sub={t("tokens_sub")}/>

      <Card title="Брэнд өнгө" sub="Үндсэн брэнд цэнхэр + туслах тэнгисийн өнгө" style={{ marginBottom: 20 }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(9, 1fr)", gap: 8 }}>
          {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].slice(0, 9).map(s => (
            <Sw key={"b"+s} c={`var(--brand-${s})`} l={`brand-${s}`}/>
          ))}
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginTop: 12 }}>
          {[50, 100, 200, 300, 400, 500, 600].map(s => (
            <Sw key={"s"+s} c={`var(--sky-${s})`} l={`sky-${s}`}/>
          ))}
        </div>
      </Card>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card title="Нейтрал" sub="Текст, фон, хүрээ">
          <div className="grid" style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {[0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(s => (
              <Sw key={"n"+s} c={`var(--ink-${s})`} l={`ink-${s}`}/>
            ))}
          </div>
        </Card>

        <Card title="Систем өнгө" sub="Амжилт · Анхааруулга · Алдаа · Мэдээлэл">
          <div className="grid grid-2">
            {[
              ["ok", "Амжилт"], ["warn", "Анхааруулга"],
              ["err", "Алдаа"], ["info", "Мэдээлэл"],
            ].map(([k, l]) => (
              <div key={k} style={{ padding: 14, borderRadius: "var(--r)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: `var(--${k}-500)` }}/>
                  <b style={{ fontSize: 13 }}>{l}</b>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Sw c={`var(--${k}-50)`}  l="50"/>
                  <Sw c={`var(--${k}-500)`} l="500"/>
                  <Sw c={`var(--${k}-700)`} l="700"/>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card title="Типографи" sub="IBM Plex Sans + IBM Plex Mono">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["t-5xl", "48px / 600", "Дотуур байр"],
              ["t-4xl", "38px / 600", "Хяналтын самбар"],
              ["t-3xl", "30px / 600", "Гарчиг — Page"],
              ["t-2xl", "24px / 600", "Гарчиг — Card"],
              ["t-xl",  "20px / 500", "Дэд гарчиг"],
              ["t-lg",  "17px / 500", "Хүчтэй текст"],
              ["t-base","14px / 400", "Үндсэн текст. Орчин үеийн дотуур байрны систем."],
              ["t-sm",  "13px / 400", "Туслах текст"],
              ["t-xs",  "12px / 400", "Mета мэдээлэл"],
            ].map(([k, m, sample]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "100px 110px 1fr", alignItems: "baseline", gap: 12 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{k}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>{m}</span>
                <span style={{ fontSize: `var(--${k})`, fontWeight: k.includes("xl") ? 600 : k === "t-lg" ? 500 : 400, lineHeight: 1.25 }}>{sample}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Зай ба бөөрөнхий" sub="Spacing scale + corner radius">
          <div style={{ marginBottom: 18 }}>
            <div className="section-title" style={{ marginBottom: 10 }}>Spacing (4px суурь)</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              {[
                ["1", 4], ["2", 8], ["3", 12], ["4", 16], ["5", 20],
                ["6", 24], ["8", 32], ["10", 40], ["12", 48], ["16", 64],
              ].map(([k, v]) => (
                <div key={k} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: v, height: v, background: "var(--primary)", borderRadius: 2, margin: "0 auto" }}/>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>s-{k}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-faint)" }}>{v}px</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="section-title" style={{ marginBottom: 10 }}>Corner radius</div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                ["sm", "var(--r-sm)"], ["base", "var(--r)"],
                ["md", "var(--r-md)"], ["lg", "var(--r-lg)"],
                ["xl", "var(--r-xl)"], ["2xl", "var(--r-2xl)"],
              ].map(([k, v]) => (
                <div key={k} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: 56, background: "var(--primary-soft)", border: "1px solid var(--border-strong)", borderRadius: v }}/>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>r-{k}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card title="Сүүдэр" sub="Elevation 1–3 + Glass">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              ["sh-1", "var(--sh-1)"], ["sh-2", "var(--sh-2)"],
              ["sh-3", "var(--sh-3)"], ["glass", "var(--sh-glass)"],
            ].map(([k, v]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ height: 70, background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", boxShadow: v }}/>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>{k}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Glass tokens" sub="Login glassmorphism">
          <div style={{
            background: "linear-gradient(135deg, var(--brand-700), var(--sky-400))",
            padding: 24, borderRadius: "var(--r-md)",
            display: "flex", gap: 12, justifyContent: "center"
          }}>
            {[
              ["soft", "rgba(255,255,255,.10)", 18],
              ["base", "rgba(255,255,255,.14)", 28],
              ["intense", "rgba(255,255,255,.18)", 36],
            ].map(([k, bg, blur]) => (
              <div key={k} style={{
                flex: 1, padding: 16, color: "white",
                background: bg, border: "1px solid rgba(255,255,255,.4)",
                borderRadius: "var(--r-md)",
                backdropFilter: `blur(${blur}px) saturate(160%)`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(160%)`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.55)"
              }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{k}</div>
                <div style={{ fontSize: 10, opacity: .85 }}>blur({blur}px)</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Компонентууд" sub="Button, Input, Badge, Tabs, Skeleton, Empty">
        <div className="grid grid-2" style={{ gap: 24 }}>
          <div>
            <div className="section-title">Button variants</div>
            <div className="row">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary">Regular</Button>
              <Button variant="primary" size="lg">Large</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>

            <div className="section-title" style={{ marginTop: 20 }}>Badges</div>
            <div className="row">
              <Badge tone="default" dot>Default</Badge>
              <Badge tone="brand" dot>Брэнд</Badge>
              <Badge tone="ok" dot>Амжилттай</Badge>
              <Badge tone="warn" dot>Хүлээгдэж буй</Badge>
              <Badge tone="err" dot>Алдаа</Badge>
              <Badge tone="info" dot>Мэдээлэл</Badge>
            </div>

            <div className="section-title" style={{ marginTop: 20 }}>Tabs</div>
            <Tabs tabs={[{ value: "a", label: "Сегмент" }, { value: "b", label: "Хоёр" }, { value: "c", label: "Гурав" }]}
                  value="a" onChange={() => {}}/>
          </div>

          <div>
            <div className="section-title">Inputs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Input label="Хэвийн" placeholder="placeholder" lead={<IcSearch size={14}/>}/>
              <Input label="Алдаатай" placeholder="invalid input" error="Утга буруу байна"/>
              <Input label="Идэвхгүй" placeholder="—" disabled/>
            </div>

            <div className="section-title" style={{ marginTop: 20 }}>Skeleton + Empty</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
              <Skel w="60%" h={14}/>
              <Skel w="80%" h={12}/>
              <Skel w="40%" h={12}/>
            </div>
            <Empty title="Хоосон төлөв" message="Энд илрэх ямар нэг бичлэг алга."
                   action={<Button variant="secondary" size="sm" icon={<IcPlus size={12}/>}>Шинэ нэмэх</Button>}/>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Sw({ c, l }) {
  return (
    <div>
      <div className="swatch" style={{ background: c }}/>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>{l}</div>
    </div>
  );
}

window.TokensScreen = TokensScreen;
