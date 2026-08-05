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
  var incoming = param("c") || param("utm_source");

  if (incoming) {
    writeStore(incoming);                 // latest scan wins
    try {
      if (window.gtag) window.gtag("event", "referral_visit", {
        ref: incoming,
        medium: param("utm_medium") || "",
        campaign: param("utm_campaign") || ""
      });
    } catch (e) {}
  }

  // Exposed for the registration form to include in its submission.
  window.SLSReferral = readStore() || "";
})();
