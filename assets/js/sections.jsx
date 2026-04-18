// Body sections — content comes from window.COPY / window.WORKSHOPS / etc.,
// populated by assets/js/data.js (rendered server-side from _data/*.yml).

// ---------- Workshop strip (loops over _data/workshops.yml) ----------
function WorkshopStrip() {
  const ws = window.WORKSHOPS || [];
  if (!ws.length) return null;
  const c = (window.COPY && window.COPY.workshop_strip) || {};
  return (
    <section className="workshop-strip">
      <div className="workshop-inner">
        <div className="workshop-head">
          <div className="workshop-eyebrow">
            <span className="workshop-dot" /> {c.eyebrow || "Upcoming Workshop"}
          </div>
          <h2 className="workshop-headline">{c.headline || "Upcoming Workshops"}</h2>
        </div>
        {ws.map((w, i) => (
          <div key={i} className={`workshop-card kind-${w.kind || "social"}`}>
            <div className="workshop-card-date">
              <div className="workshop-card-month">{w.month}</div>
              <div className="workshop-card-day">{w.day}</div>
              <div className="workshop-card-year">{w.year}</div>
            </div>
            <div className="workshop-card-body">
              <div className="workshop-card-title">{w.title}</div>
              <div className="workshop-card-meta">
                {w.time}{w.time && w.location ? " · " : ""}{w.location}
              </div>
              {w.lede && <p className="workshop-card-lede">{w.lede}</p>}
            </div>
            <div className="workshop-card-cta">
              {w.info_url && (
                <a className="workshop-card-btn" href={w.info_url} target="_blank" rel="noreferrer">
                  Event info ↗
                </a>
              )}
              <a className="workshop-card-btn workshop-card-btn-primary"
                 href={w.register_url || "/registration_workshop"}>
                Register →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() { return null; }

// ---------- Schedule ----------
function ScheduleCards() {
  const activeDays = SCHEDULE.filter((d) => d.slots && d.slots.length > 0);
  return (
    <div className="sc sc-with-blurbs">
      {activeDays.map((day) => (
        <div key={day.day} className="sc-day">
          <div className="sc-day-head">{day.day}</div>
          <div className="sc-cards">
            {day.slots.map((s, i) => (
              <div key={i} className={`sc-card kind-${s.kind}`}>
                <div className="sc-card-head">
                  <div className="sc-card-time">{s.time} – {s.end}</div>
                </div>
                <div className="sc-card-name">
                  {s.name}
                  {s.subname && <div className="sc-card-sub">{s.subname}</div>}
                </div>
                {s.blurb && <p className="sc-card-blurb">{s.blurb}</p>}
                {s.note && <div className="sc-card-note">{s.note}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleGrid() {
  const c  = (window.COPY && window.COPY.schedule_header) || {};
  const fb = ((window.COPY || {}).footer || {}).social && window.COPY.footer.social.facebook;
  return (
    <section className="schedule" id="schedule">
      <div className="schedule-head">
        <SectionLabel num="02">{c.eyebrow || "Schedule & Classes"}</SectionLabel>
        <h2 className="section-title section-title-xl">
          {c.title || ((window.SEASON || {}).name)}
        </h2>
        <p className="schedule-sub schedule-sub-small">
          {c.subtitle_lead || ""}{" "}
          <a className="sch-fb-link" href={fb} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z"/>
            </svg>
            Facebook
          </a>{" "}
          {c.subtitle_trail || ""}
        </p>
      </div>

      <div className="schedule-body schedule-merged">
        <ScheduleCards />
      </div>

      <div className="schedule-footer">
        <div className="schedule-loc">
          <span className="schedule-loc-label">Classes at</span>
          <span className="schedule-loc-addr">{c.location}</span>
        </div>
        <Button href="/registration">Register for the season</Button>
      </div>
    </section>
  );
}

// ---------- Levels strip ----------
function Classes() {
  return (
    <section className="classes classes-strip-only" id="classes">
      <LevelsStrip />
    </section>
  );
}

function LevelsStrip() {
  const c = (window.COPY && window.COPY.classes_intro) || {};
  return (
    <div className="levels-strip">
      <div className="levels-strip-intro">
        <div className="levels-strip-label">{c.title || "Which class is for you?"}</div>
        <p className="levels-strip-lede" dangerouslySetInnerHTML={{ __html: c.lede || "" }} />
      </div>
      <div className="levels-strip-row">
        {LEVELS.map((l) => (
          <div key={l.name} className={`lvl-item kind-${l.kind}`}>
            <div className="lvl-swatch" />
            <div className="lvl-name">{l.name}</div>
            <div className="lvl-blurb">{l.blurb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Pricing() {
  const c = (window.COPY && window.COPY.pricing) || {};
  return (
    <section className="pricing" id="pricing">
      <div className="pricing-head">
        <SectionLabel num="04">Pricing</SectionLabel>
        <h2 className="section-title">{c.title}</h2>
        <p className="pricing-sub" dangerouslySetInnerHTML={{ __html: c.subtitle || "" }} />
      </div>
      <div className="pricing-grid">
        {PRICING.map((p) => (
          <article key={p.pkg} className="price-card">
            <div className="price-head">
              <h3 className="price-name">{p.pkg}</h3>
              <div className="price-meta">{p.meta}</div>
            </div>
            <div className="price-rows">
              <div className="price-row">
                <span className="price-row-label">Regular</span>
                <span className="price-row-value">{p.regular}</span>
                <span className="price-row-save">{p.saveR ? `You save ${p.saveR.replace(/^Save\s*/,"")}` : ""}</span>
              </div>
              <div className="price-row">
                <span className="price-row-label">Student</span>
                <span className="price-row-value">{p.student}</span>
                <span className="price-row-save">{p.saveS ? `You save ${p.saveS.replace(/^Save\s*/,"")}` : ""}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Requirements() { return null; }

function Register() {
  const c = (window.COPY && window.COPY.register) || {};
  const photo = c.photo ? "/" + c.photo.replace(/^\//, "") : "/assets/images/photo-class-1.png";
  return (
    <section className="register" id="register">
      <div className="register-bg">
        <img src={photo} alt="" />
      </div>
      <div className="register-body">
        <div className="register-kicker">
          <span className="hero-kicker-dot" /> {c.kicker}
        </div>
        <h2 className="register-title">
          <span>{c.title_line_1}</span>
          <span className="register-title-accent">{c.title_line_2}</span>
        </h2>
        <p className="register-lede">{c.lede}</p>
        <div className="register-cta-row">
          <Button href={(c.cta_primary   || {}).href}>{(c.cta_primary   || {}).label}</Button>
          <Button href={(c.cta_secondary || {}).href} variant="ghost-light">
            {(c.cta_secondary || {}).label}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const f = (window.COPY && window.COPY.footer) || {};
  const cols = f.columns || [];
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src="/assets/images/logo.png" alt="Salsa LA-Style" />
          <div className="footer-brand-text">
            <div className="footer-brand-main">{f.brand_main}</div>
            <div className="footer-brand-sub">{f.brand_sub}</div>
          </div>
        </div>
        <div className="footer-cols">
          {cols.map((col, i) => (
            <div key={i} className="footer-col">
              <div className="footer-col-title">{col.title}</div>
              {(col.links || []).map((l, j) => (
                <a key={j} href={l.href}>{l.label}</a>
              ))}
            </div>
          ))}
          {(f.social) && (
            <div className="footer-col">
              <div className="footer-col-title">Follow</div>
              {f.social.instagram && <a href={f.social.instagram}>Instagram ↗</a>}
              {f.social.facebook  && <a href={f.social.facebook}>Facebook ↗</a>}
            </div>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <div>{f.copyright}</div>
      </div>
    </footer>
  );
}

Object.assign(window, { WorkshopStrip, About, ScheduleGrid, Classes, Pricing, Requirements, Register, Footer });
