// Body sections — content comes from window.COPY / window.WORKSHOPS / etc.,
// populated by assets/js/data.js (rendered server-side from _data/*.yml).

// ---------- Calendar icon button (shared) ----------
function CalendarIcon() {
  return <span className="cal-emoji" role="img" aria-hidden="true">📅</span>;
}

function CalendarButton({ onClick, className }) {
  const label = "Add to calendar";
  return (
    <button
      type="button"
      className={"cal-btn " + (className || "")}
      onClick={onClick}
      aria-label={label}
    >
      <span className="cal-btn-label">{label}</span>
      <CalendarIcon />
    </button>
  );
}

// ---------- Events (workshops + socials, combined via _data + data.js) ----------

function EventsPlaceholder({ c }) {
  const cards = c.placeholders || [];
  if (!cards.length) return null;
  return (
    <>
      {c.empty_note && <p className="events-empty-note">{c.empty_note}</p>}
      <div className="events-placeholder-grid">
        {cards.map((p, i) => (
          <div key={i} className={`event-placeholder-card kind-${p.kind || "social"}`}>
            <div className="event-placeholder-title">{p.title}</div>
            {p.text && <p className="event-placeholder-text">{p.text}</p>}
          </div>
        ))}
      </div>
    </>
  );
}

function Events() {
  const events = window.EVENTS || [];
  const c = (window.COPY && window.COPY.events) || {};
  const hasEvents = events.length > 0;
  return (
    <section className="workshop-strip" id="events">
      <div className="workshop-inner">
        <div className="workshop-head">
          <div className="workshop-eyebrow">
            <span className="workshop-dot" /> {c.eyebrow || "Events"}
          </div>
          <h2 className="workshop-headline">{c.headline || "Upcoming events"}</h2>
        </div>
        <p className="events-subscribe">
          <button
            type="button"
            className="events-subscribe-btn"
            onClick={() => window.SLSAddCal && window.SLSAddCal.subscribe((window.SITE_URL || "") + "/events/all.ics")}
          >
            🔔 Subscribe to all events
          </button>
          <span className="events-subscribe-note">— get every workshop &amp; social in your calendar, automatically.</span>
        </p>
        {!hasEvents && <EventsPlaceholder c={c} />}
        {hasEvents && events.map((e, i) => (
          <div key={i} className={`workshop-card kind-${e.kind}`}>
            <div className="workshop-card-date">
              <div className="workshop-card-month">{e._month}</div>
              <div className="workshop-card-day">{e._day}</div>
              <div className="workshop-card-year">{e._year}</div>
            </div>
            <div className="workshop-card-body">
              <div className="workshop-card-title">
                {e.page_url
                  ? <a className="workshop-card-title-link" href={e.page_url}>{e.title}</a>
                  : e.title}
              </div>
              <div className="workshop-card-meta">
                {e._time}{e._time && e.location ? " · " : ""}{e.location}
              </div>
              {e.lede && <p className="workshop-card-lede">{e.lede}</p>}
            </div>
            <div className="workshop-card-cta">
              {e.page_url && (
                <a className="workshop-card-btn workshop-card-btn-primary" href={e.page_url}>
                  See event →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Backwards-compatible alias (app.jsx may still reference WorkshopStrip).
const WorkshopStrip = Events;

function About() { return null; }

// ---------- Schedule ----------
function ScheduleCards({ days }) {
  const activeDays = days
    ? SCHEDULE.filter((d) => days.indexOf(d.day) !== -1 && d.slots && d.slots.length > 0)
    : SCHEDULE.filter((d) => d.slots && d.slots.length > 0);
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
                {s.kind !== "social" && (window.SEASON && window.SEASON.first_class) && (
                  <CalendarButton
                    className="cal-btn-block"
                    onClick={() => window.SLSCalendar && window.SLSCalendar.downloadClass(s)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScheduleGrid() {
  // Kept for backwards compat; new layout uses WednesdayClasses + FridaySocials below.
  return null;
}

function WednesdayClasses() {
  const c = (window.COPY && window.COPY.wednesday_classes) || {};
  return (
    <section className="schedule" id="schedule">
      <div className="schedule-head">
        <SectionLabel num="01">{c.eyebrow || "Schedule"}</SectionLabel>
        <h2 className="section-title section-title-xl">
          {c.title || "Wednesday classes"}
        </h2>
        {c.subtitle && (
          <p className="schedule-sub schedule-sub-small">{c.subtitle}</p>
        )}
      </div>
      <div className="schedule-body schedule-merged">
        <ScheduleCards days={["Wednesday"]} />
      </div>
    </section>
  );
}

function FridaySocials() {
  const c  = (window.COPY && window.COPY.friday_socials) || {};
  const fb = ((window.COPY || {}).footer || {}).social && window.COPY.footer.social.facebook;
  return (
    <section className="schedule" id="socials">
      <div className="schedule-head">
        <SectionLabel num="03">{c.eyebrow || "Socials"}</SectionLabel>
        <h2 className="section-title section-title-xl">
          {c.title || "Friday socials"}
        </h2>
        {(c.subtitle_lead || c.subtitle_trail) && (
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
        )}
      </div>
      <div className="schedule-body schedule-merged">
        <ScheduleCards days={["Friday"]} />
      </div>
      {c.location_address && (
        <div className="schedule-footer">
          <div className="schedule-loc">
            <span className="schedule-loc-label">{c.location_label || "All socials at"}</span>
            <span className="schedule-loc-addr">{c.location_address}</span>
          </div>
        </div>
      )}
    </section>
  );
}

function Location() {
  const c = (window.COPY && window.COPY.location) || {};
  return (
    <section className="schedule schedule-location">
      <div className="schedule-footer">
        <div className="schedule-loc">
          <span className="schedule-loc-label">{c.label || "Classes at"}</span>
          <span className="schedule-loc-addr">{c.address}</span>
        </div>
        <Button href={c.cta_href || "/registration"}>
          {c.cta_label || "Register for the season"}
        </Button>
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
        <SectionLabel num="02">Pricing</SectionLabel>
        <h2 className="section-title">{c.title}</h2>
        <p className="pricing-sub" dangerouslySetInnerHTML={{ __html: c.subtitle || "" }} />
        {c.dropin_callout && (
          <p className="pricing-dropin" dangerouslySetInnerHTML={{ __html: c.dropin_callout }} />
        )}
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

Object.assign(window, {
  Events, WorkshopStrip, About, ScheduleGrid, WednesdayClasses, FridaySocials, Location,
  Classes, Pricing, Requirements, Register, Footer,
});
