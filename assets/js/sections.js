// Body sections — content comes from window.COPY / window.WORKSHOPS / etc.,
// populated by assets/js/data.js (rendered server-side from _data/*.yml).

// ---------- Calendar icon button (shared) ----------
function CalendarIcon() {
  return /*#__PURE__*/React.createElement("span", {
    className: "cal-emoji",
    role: "img",
    "aria-hidden": "true"
  }, "\uD83D\uDCC5");
}
function CalendarButton({
  onClick,
  className
}) {
  const label = "Add to calendar";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "cal-btn " + (className || ""),
    onClick: onClick,
    "aria-label": label
  }, /*#__PURE__*/React.createElement("span", {
    className: "cal-btn-label"
  }, label), /*#__PURE__*/React.createElement(CalendarIcon, null));
}

// ---------- Events (workshops + socials, combined via _data + data.js) ----------

function EventsPlaceholder({
  c
}) {
  const cards = c.placeholders || [];
  if (!cards.length) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, c.empty_note && /*#__PURE__*/React.createElement("p", {
    className: "events-empty-note"
  }, c.empty_note), /*#__PURE__*/React.createElement("div", {
    className: "events-placeholder-grid"
  }, cards.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `event-placeholder-card kind-${p.kind || "social"}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "event-placeholder-title"
  }, p.title), p.text && /*#__PURE__*/React.createElement("p", {
    className: "event-placeholder-text"
  }, p.text)))));
}
function Events() {
  const events = window.EVENTS || [];
  const c = window.COPY && window.COPY.events || {};
  const hasEvents = events.length > 0;
  return /*#__PURE__*/React.createElement("section", {
    className: "workshop-strip",
    id: "events"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-eyebrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "workshop-dot"
  }), " ", c.eyebrow || "Events"), /*#__PURE__*/React.createElement("h2", {
    className: "workshop-headline"
  }, c.headline || "Upcoming events")), /*#__PURE__*/React.createElement("p", {
    className: "events-subscribe"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "events-subscribe-btn",
    onClick: () => window.SLSAddCal && window.SLSAddCal.subscribe((window.SITE_URL || "") + "/events/all.ics")
  }, "\uD83D\uDD14 Subscribe to all events"), /*#__PURE__*/React.createElement("span", {
    className: "events-subscribe-note"
  }, "\u2014 get every workshop & social in your calendar, automatically.")), !hasEvents && /*#__PURE__*/React.createElement(EventsPlaceholder, {
    c: c
  }), hasEvents && events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `workshop-card kind-${e.kind}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-date"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-month"
  }, e._month), /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-day"
  }, e._day), /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-year"
  }, e._year)), /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-title"
  }, e.page_url ? /*#__PURE__*/React.createElement("a", {
    className: "workshop-card-title-link",
    href: e.page_url
  }, e.title) : e.title), /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-meta"
  }, e._time, e._time && e.location ? " · " : "", e.location), e.lede && /*#__PURE__*/React.createElement("p", {
    className: "workshop-card-lede"
  }, e.lede)), /*#__PURE__*/React.createElement("div", {
    className: "workshop-card-cta"
  }, e.page_url && /*#__PURE__*/React.createElement("a", {
    className: "workshop-card-btn workshop-card-btn-primary",
    href: e.page_url
  }, "See event \u2192"))))));
}

// Backwards-compatible alias (app.jsx may still reference WorkshopStrip).
const WorkshopStrip = Events;
function About() {
  return null;
}

// ---------- Schedule ----------
function ScheduleCards({
  days
}) {
  const activeDays = days ? SCHEDULE.filter(d => days.indexOf(d.day) !== -1 && d.slots && d.slots.length > 0) : SCHEDULE.filter(d => d.slots && d.slots.length > 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "sc sc-with-blurbs"
  }, activeDays.map(day => /*#__PURE__*/React.createElement("div", {
    key: day.day,
    className: "sc-day"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sc-day-head"
  }, day.day), /*#__PURE__*/React.createElement("div", {
    className: "sc-cards"
  }, day.slots.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: `sc-card kind-${s.kind}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "sc-card-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sc-card-time"
  }, s.time, " \u2013 ", s.end)), /*#__PURE__*/React.createElement("div", {
    className: "sc-card-name"
  }, s.name, s.subname && /*#__PURE__*/React.createElement("div", {
    className: "sc-card-sub"
  }, s.subname)), s.blurb && /*#__PURE__*/React.createElement("p", {
    className: "sc-card-blurb"
  }, s.blurb), s.note && /*#__PURE__*/React.createElement("div", {
    className: "sc-card-note"
  }, s.note), s.kind !== "social" && window.SEASON && window.SEASON.first_class && /*#__PURE__*/React.createElement(CalendarButton, {
    className: "cal-btn-block",
    onClick: () => window.SLSCalendar && window.SLSCalendar.downloadClass(s)
  })))))));
}
function ScheduleGrid() {
  // Kept for backwards compat; new layout uses WednesdayClasses + FridaySocials below.
  return null;
}
function WednesdayClasses() {
  const c = window.COPY && window.COPY.wednesday_classes || {};
  return /*#__PURE__*/React.createElement("section", {
    className: "schedule",
    id: "schedule"
  }, /*#__PURE__*/React.createElement("div", {
    className: "schedule-head"
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    num: "01"
  }, c.eyebrow || "Schedule"), /*#__PURE__*/React.createElement("h2", {
    className: "section-title section-title-xl"
  }, c.title || "Wednesday classes"), c.subtitle && /*#__PURE__*/React.createElement("p", {
    className: "schedule-sub schedule-sub-small"
  }, c.subtitle)), /*#__PURE__*/React.createElement("div", {
    className: "schedule-body schedule-merged"
  }, /*#__PURE__*/React.createElement(ScheduleCards, {
    days: ["Wednesday"]
  })));
}
function FridaySocials() {
  const c = window.COPY && window.COPY.friday_socials || {};
  const fb = ((window.COPY || {}).footer || {}).social && window.COPY.footer.social.facebook;
  return /*#__PURE__*/React.createElement("section", {
    className: "schedule",
    id: "socials"
  }, /*#__PURE__*/React.createElement("div", {
    className: "schedule-head"
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    num: "03"
  }, c.eyebrow || "Socials"), /*#__PURE__*/React.createElement("h2", {
    className: "section-title section-title-xl"
  }, c.title || "Friday socials"), (c.subtitle_lead || c.subtitle_trail) && /*#__PURE__*/React.createElement("p", {
    className: "schedule-sub schedule-sub-small"
  }, c.subtitle_lead || "", " ", /*#__PURE__*/React.createElement("a", {
    className: "sch-fb-link",
    href: fb,
    target: "_blank",
    rel: "noreferrer"
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    fill: "currentColor",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M13.5 21v-8H16l.5-3H13.5V8.2c0-.9.3-1.5 1.6-1.5H17V4.1C16.5 4 15.5 4 14.5 4c-2.3 0-3.8 1.4-3.8 3.9V10H8v3h2.7v8h2.8z"
  })), "Facebook"), " ", c.subtitle_trail || "")), /*#__PURE__*/React.createElement("div", {
    className: "schedule-body schedule-merged"
  }, /*#__PURE__*/React.createElement(ScheduleCards, {
    days: ["Friday"]
  })), c.location_address && /*#__PURE__*/React.createElement("div", {
    className: "schedule-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "schedule-loc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "schedule-loc-label"
  }, c.location_label || "All socials at"), /*#__PURE__*/React.createElement("span", {
    className: "schedule-loc-addr"
  }, c.location_address))));
}
function Location() {
  const c = window.COPY && window.COPY.location || {};
  return /*#__PURE__*/React.createElement("section", {
    className: "schedule schedule-location"
  }, /*#__PURE__*/React.createElement("div", {
    className: "schedule-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "schedule-loc"
  }, /*#__PURE__*/React.createElement("span", {
    className: "schedule-loc-label"
  }, c.label || "Classes at"), /*#__PURE__*/React.createElement("span", {
    className: "schedule-loc-addr"
  }, c.address)), /*#__PURE__*/React.createElement(Button, {
    href: c.cta_href || "/registration"
  }, c.cta_label || "Register for the season")));
}

// ---------- Levels strip ----------
function Classes() {
  return /*#__PURE__*/React.createElement("section", {
    className: "classes classes-strip-only",
    id: "classes"
  }, /*#__PURE__*/React.createElement(LevelsStrip, null));
}
function LevelsStrip() {
  const c = window.COPY && window.COPY.classes_intro || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "levels-strip"
  }, /*#__PURE__*/React.createElement("div", {
    className: "levels-strip-intro"
  }, /*#__PURE__*/React.createElement("div", {
    className: "levels-strip-label"
  }, c.title || "Which class is for you?"), /*#__PURE__*/React.createElement("p", {
    className: "levels-strip-lede",
    dangerouslySetInnerHTML: {
      __html: c.lede || ""
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "levels-strip-row"
  }, LEVELS.map(l => /*#__PURE__*/React.createElement("div", {
    key: l.name,
    className: `lvl-item kind-${l.kind}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "lvl-swatch"
  }), /*#__PURE__*/React.createElement("div", {
    className: "lvl-name"
  }, l.name), /*#__PURE__*/React.createElement("div", {
    className: "lvl-blurb"
  }, l.blurb)))));
}
function Pricing() {
  const c = window.COPY && window.COPY.pricing || {};
  return /*#__PURE__*/React.createElement("section", {
    className: "pricing",
    id: "pricing"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pricing-head"
  }, /*#__PURE__*/React.createElement(SectionLabel, {
    num: "02"
  }, "Pricing"), /*#__PURE__*/React.createElement("h2", {
    className: "section-title"
  }, c.title), /*#__PURE__*/React.createElement("p", {
    className: "pricing-sub",
    dangerouslySetInnerHTML: {
      __html: c.subtitle || ""
    }
  }), c.dropin_callout && /*#__PURE__*/React.createElement("p", {
    className: "pricing-dropin",
    dangerouslySetInnerHTML: {
      __html: c.dropin_callout
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "pricing-grid"
  }, PRICING.map(p => /*#__PURE__*/React.createElement("article", {
    key: p.pkg,
    className: `price-card${p.flat ? " price-card-flat" : ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "price-head"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "price-name"
  }, p.pkg), /*#__PURE__*/React.createElement("div", {
    className: "price-meta"
  }, p.meta)), /*#__PURE__*/React.createElement("div", {
    className: "price-rows"
  }, p.flat ?
  /*#__PURE__*/
  /* One price for everyone (bring-a-friend pair price). */
  React.createElement("div", {
    className: "price-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "price-row-label"
  }, p.flatLabel), /*#__PURE__*/React.createElement("span", {
    className: "price-row-value"
  }, p.flat, p.flatMeta && /*#__PURE__*/React.createElement("span", {
    className: "price-row-sub"
  }, p.flatMeta)), /*#__PURE__*/React.createElement("span", {
    className: "price-row-save"
  }, p.saveFlat ? `You save ${p.saveFlat.replace(/^Save\s*/, "")}` : "")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "price-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "price-row-label"
  }, "Regular"), /*#__PURE__*/React.createElement("span", {
    className: "price-row-value"
  }, p.regular), /*#__PURE__*/React.createElement("span", {
    className: "price-row-save"
  }, p.saveR ? `You save ${p.saveR.replace(/^Save\s*/, "")}` : "")), /*#__PURE__*/React.createElement("div", {
    className: "price-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "price-row-label"
  }, "Student"), /*#__PURE__*/React.createElement("span", {
    className: "price-row-value"
  }, p.student), /*#__PURE__*/React.createElement("span", {
    className: "price-row-save"
  }, p.saveS ? `You save ${p.saveS.replace(/^Save\s*/, "")}` : "")))), p.note && /*#__PURE__*/React.createElement("p", {
    className: "price-note",
    dangerouslySetInnerHTML: {
      __html: p.note
    }
  })))));
}
function Requirements() {
  return null;
}
function Register() {
  const c = window.COPY && window.COPY.register || {};
  const photo = c.photo ? "/" + c.photo.replace(/^\//, "") : "/assets/images/photo-class-1.png";
  return /*#__PURE__*/React.createElement("section", {
    className: "register",
    id: "register"
  }, /*#__PURE__*/React.createElement("div", {
    className: "register-bg"
  }, /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "register-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "register-kicker"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-kicker-dot"
  }), " ", c.kicker), /*#__PURE__*/React.createElement("h2", {
    className: "register-title"
  }, /*#__PURE__*/React.createElement("span", null, c.title_line_1), /*#__PURE__*/React.createElement("span", {
    className: "register-title-accent"
  }, c.title_line_2)), /*#__PURE__*/React.createElement("p", {
    className: "register-lede"
  }, c.lede), /*#__PURE__*/React.createElement("div", {
    className: "register-cta-row"
  }, /*#__PURE__*/React.createElement(Button, {
    href: (c.cta_primary || {}).href
  }, (c.cta_primary || {}).label), /*#__PURE__*/React.createElement(Button, {
    href: (c.cta_secondary || {}).href,
    variant: "ghost-light"
  }, (c.cta_secondary || {}).label))));
}
function Footer() {
  const f = window.COPY && window.COPY.footer || {};
  const cols = f.columns || [];
  return /*#__PURE__*/React.createElement("footer", {
    className: "footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "/assets/images/logo.png",
    alt: "Salsa LA-Style"
  }), /*#__PURE__*/React.createElement("div", {
    className: "footer-brand-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-brand-main"
  }, f.brand_main), /*#__PURE__*/React.createElement("div", {
    className: "footer-brand-sub"
  }, f.brand_sub))), /*#__PURE__*/React.createElement("div", {
    className: "footer-cols"
  }, cols.map((col, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-col-title"
  }, col.title), (col.links || []).map((l, j) => /*#__PURE__*/React.createElement("a", {
    key: j,
    href: l.href
  }, l.label)))), f.social && /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-col-title"
  }, "Follow"), f.social.instagram && /*#__PURE__*/React.createElement("a", {
    href: f.social.instagram
  }, "Instagram \u2197"), f.social.facebook && /*#__PURE__*/React.createElement("a", {
    href: f.social.facebook
  }, "Facebook \u2197")))), /*#__PURE__*/React.createElement("div", {
    className: "footer-bottom"
  }, /*#__PURE__*/React.createElement("div", null, f.copyright)));
}
Object.assign(window, {
  Events,
  WorkshopStrip,
  About,
  ScheduleGrid,
  WednesdayClasses,
  FridaySocials,
  Location,
  Classes,
  Pricing,
  Requirements,
  Register,
  Footer
});