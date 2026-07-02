// Client-side iCalendar (.ics) generation. No server / plugin required, so it
// works on GitHub Pages. On phones, opening the downloaded .ics hands it to the
// native calendar app (Apple Calendar / Google Calendar) with an "Add" prompt.

(function () {
  "use strict";

  var TZID = "Europe/Copenhagen";

  // A correct VTIMEZONE for Copenhagen so events land at the right local time
  // regardless of the viewer's own timezone or DST.
  var VTIMEZONE = [
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Copenhagen",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0200",
    "TZNAME:CEST",
    "DTSTART:19700329T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19701025T030000",
    "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE"
  ].join("\r\n");

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function escapeText(s) {
    return String(s == null ? "" : s)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");
  }

  function slug(s) {
    return String(s || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // "2026-09-02" + "18:00" -> "20260902T180000"
  function dtLocal(dateStr, timeStr) {
    var d = String(dateStr).replace(/-/g, "");
    var t = (timeStr || "00:00").replace(/:/g, "") + "00";
    return d + "T" + t;
  }

  // UTC stamp for DTSTAMP, e.g. "20260420T120000Z"
  function nowStamp() {
    var d = new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
      "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }

  // If no end time, default to +1 hour.
  function defaultEnd(timeStr) {
    if (!timeStr) return "";
    var parts = timeStr.split(":");
    var h = (parseInt(parts[0], 10) + 1) % 24;
    return pad(h) + ":" + (parts[1] || "00");
  }

  function wrapCalendar(vevents) {
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Salsa LA-Style//Website//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      VTIMEZONE,
      vevents,
      "END:VCALENDAR"
    ].join("\r\n");
  }

  // Build a single (non-recurring) VEVENT from an events.yml-style object.
  function eventVEVENT(e) {
    var start = e.start || "00:00";
    var end = e.end || defaultEnd(start);
    var lines = [
      "BEGIN:VEVENT",
      "UID:" + slug(e.title) + "-" + String(e.date).replace(/-/g, "") + "@salsalastyle.dk",
      "DTSTAMP:" + nowStamp(),
      "DTSTART;TZID=" + TZID + ":" + dtLocal(e.date, start),
      "DTEND;TZID=" + TZID + ":" + dtLocal(e.date, end),
      "SUMMARY:" + escapeText(e.calendar_title || e.title)
    ];
    if (e.location) lines.push("LOCATION:" + escapeText(e.location));
    // Prefer a calendar-specific description; fall back to the website lede.
    var body = e.calendar_description || e.lede;
    var desc = [body, e.info_url].filter(Boolean).join("\n\n");
    if (desc) lines.push("DESCRIPTION:" + escapeText(desc));
    if (e.info_url) lines.push("URL:" + escapeText(e.info_url));
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  }

  // Build a recurring weekly VEVENT for a class.
  // opts: { title, start, end, location, firstDate, count, exdates: [], description, url }
  function classVEVENT(opts) {
    var start = opts.start || "00:00";
    var end = opts.end || defaultEnd(start);
    var lines = [
      "BEGIN:VEVENT",
      "UID:" + slug(opts.title) + "-" + String(opts.firstDate).replace(/-/g, "") + "@salsalastyle.dk",
      "DTSTAMP:" + nowStamp(),
      "DTSTART;TZID=" + TZID + ":" + dtLocal(opts.firstDate, start),
      "DTEND;TZID=" + TZID + ":" + dtLocal(opts.firstDate, end),
      "RRULE:FREQ=WEEKLY;COUNT=" + (opts.count || 1)
    ];
    (opts.exdates || []).forEach(function (d) {
      lines.push("EXDATE;TZID=" + TZID + ":" + dtLocal(d, start));
    });
    lines.push("SUMMARY:" + escapeText(opts.title));
    if (opts.location) lines.push("LOCATION:" + escapeText(opts.location));
    var desc = [opts.description, opts.url].filter(Boolean).join("\n\n");
    if (desc) lines.push("DESCRIPTION:" + escapeText(desc));
    if (opts.url) lines.push("URL:" + escapeText(opts.url));
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  }

  function download(filename, text) {
    var blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // Public API.
  window.SLSCalendar = {
    // Download a one-off event (workshop / social).
    downloadEvent: function (e) {
      if (!e || !e.date) return;
      download(slug(e.title) + ".ics", wrapCalendar(eventVEVENT(e)));
    },
    // Download a recurring class. `slot` is a schedule.yml slot; pulls season
    // info from window.SEASON and the class location from window.COPY.
    downloadClass: function (slot) {
      var season = window.SEASON || {};
      var loc = ((window.COPY || {}).location || {}).address || slot.where || "";
      if (!season.first_class) return;
      var text = wrapCalendar(classVEVENT({
        title: slot.name + " — Salsa LA-Style",
        start: slot.time,
        end: slot.end,
        location: loc,
        firstDate: season.first_class,
        count: season.weeks || 1,
        exdates: season.exdates || [],
        url: window.SITE_URL || "",
        description: (slot.blurb || "") +
          ((season.exdates && season.exdates.length) ? "\n\nNo class in week 42 (autumn holidays)." : "")
      }));
      download(slug(slot.name) + ".ics", text);
    }
  };
})();
