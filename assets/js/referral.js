// Capture a campaign / postcard referral from the URL and remember it, so it
// can be attached to a later registration (internal attribution). Google
// Analytics captures the utm_* params on its own; this is only for our own
// records + a convenience GA event.
(function () {
  "use strict";

  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : null;
  }

  function readStore() {
    try { return localStorage.getItem("sls_ref"); } catch (e) { return null; }
  }
  function writeStore(v) {
    try { localStorage.setItem("sls_ref", v); } catch (e) {}
    // Cookie fallback (90 days) in case localStorage is unavailable.
    try {
      var d = new Date(); d.setTime(d.getTime() + 90 * 864e5);
      document.cookie = "sls_ref=" + encodeURIComponent(v) + ";expires=" + d.toUTCString() + ";path=/;SameSite=Lax";
    } catch (e) {}
  }

  // A card id can arrive as utm_source (preferred) or a short ?c= param.
  var source = param("c") || param("utm_source");
  var medium = param("utm_medium");
  var campaign = param("utm_campaign");

  // What to attribute this visit to:
  //  - a specific card id (utm_source / ?c=) always wins, latest scan first;
  //  - if only utm_medium survives (some QR apps and in-app browsers strip
  //    utm_source before we ever see it), fall back to the medium (e.g. "qr")
  //    so the visit is still tied to the print campaign — but never let that
  //    generic fallback clobber a specific card id we already captured.
  var incoming = source || (medium && !readStore() ? medium : null);

  if (incoming) {
    writeStore(incoming);                 // latest specific scan wins
    try {
      if (window.gtag) window.gtag("event", "referral_visit", {
        ref: incoming,
        medium: medium || "",
        campaign: campaign || ""
      });
    } catch (e) {}
  }

  // Exposed for the registration form to include in its submission.
  window.SLSReferral = readStore() || "";
})();
