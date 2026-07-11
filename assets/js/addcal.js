// Add-to-calendar routing — one button, best method per platform. No library,
// no picker, no branding. Reads a config object of the shape:
//   { name, description, startDate, startTime, endDate, endTime,
//     timeZone, location, icsFile }  (description may contain "[br]")
(function () {
  "use strict";

  function pad(s) { return String(s || "").replace(/[-:]/g, ""); }

  // "2026-08-30" + "15:00" -> "20260830T150000"
  function stamp(date, time) {
    return pad(date) + "T" + pad(time || "00:00") + "00";
  }

  function googleUrl(c) {
    var dates = stamp(c.startDate, c.startTime) + "/" +
                stamp(c.endDate || c.startDate, c.endTime || c.startTime);
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: c.name || "",
      dates: dates,
      details: (c.description || "").replace(/\[br\]/g, "\n"),
      location: c.location || "",
      ctz: c.timeZone || "Europe/Copenhagen"
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  var ua = navigator.userAgent || "";
  var isiOS = /iPhone|iPad|iPod/i.test(ua)
    || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPadOS
  var isAndroid = /Android/i.test(ua);
  // Instagram / Facebook in-app browsers block .ics file downloads.
  var isInApp = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);

  var platform = isiOS ? "ios" : (isAndroid ? "android" : "desktop");
  if (isInApp) platform += "-inapp";

  // Fire a Google Analytics (GA4) event, guarded so it never throws.
  function track(name, params) {
    try { if (window.gtag) window.gtag("event", name, params || {}); } catch (e) {}
  }

  window.SLSAddCal = {
    isiOS: isiOS,
    isAndroid: isAndroid,
    isInApp: isInApp,
    open: function (cfg) {
      track("add_to_calendar", { method: platform, event_name: (cfg && cfg.name) || "" });
      if (isiOS) {
        if (isInApp && cfg.icsFile) {
          // URL-scheme handoff — opens Calendar without a file download.
          window.location.href = cfg.icsFile.replace(/^https?:\/\//i, "webcal://");
        } else if (cfg.icsFile) {
          window.location.href = cfg.icsFile; // Safari opens the Add Event sheet
        }
        return;
      }
      if (isAndroid) {
        window.open(googleUrl(cfg), "_blank", "noopener"); // one-tap web add
        return;
      }
      // Desktop: download the .ics (opens Apple Calendar / Outlook).
      if (cfg.icsFile) window.location.href = cfg.icsFile;
    },
    // Subscribe to a live .ics feed (auto-updates with future events).
    // `httpsUrl` is the https://…/all.ics feed URL.
    subscribe: function (httpsUrl) {
      track("subscribe_calendar", { method: platform });
      var webcal = httpsUrl.replace(/^https?:\/\//i, "webcal://");
      if (isAndroid) {
        // Google Calendar "add by URL" (subscription).
        window.open(
          "https://calendar.google.com/calendar/render?cid=" + encodeURIComponent(webcal),
          "_blank", "noopener"
        );
        return;
      }
      // Apple / iOS / Outlook desktop all handle the webcal scheme.
      window.location.href = webcal;
    }
  };
})();
