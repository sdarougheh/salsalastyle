---
layout: page
title: "Subscribe to our events"
permalink: /events/
noindex: true
sitemap: false
lede: "Add all of our events to your calendar — it updates automatically as we add new dates."
---

<p class="sub-lede">Add all of our events to your calendar. It updates automatically whenever we add a new date — no need to check back.</p>

<div class="sub-actions">
  <button type="button" id="subAll" class="btn-primary sub-btn">🔔 Subscribe to all events</button>
  <p class="sub-alt">
    Or add it manually:
    <a href="https://calendar.google.com/calendar/render?cid=webcal%3A%2F%2Fwww.salsalastyle.dk%2Fevents%2Fall.ics" target="_blank" rel="noopener">Google Calendar</a>
    ·
    <a href="{{ '/events/all.ics' | prepend: site.url }}">Download (.ics)</a>
  </p>
</div>

<p class="sub-inapp" id="subInApp" hidden>⚠️ The link above might not work inside Instagram — try opening this page in a new browser (Safari or Chrome).</p>

<h2 class="sub-heading">Upcoming events</h2>

{%- assign today = site.time | date: '%Y-%m-%d' -%}
{%- assign evs = site.events | sort: 'date' -%}
{%- assign shown = 0 -%}
<ul class="sub-events">
{%- for e in evs -%}
  {%- assign edate = e.date | date: '%Y-%m-%d' -%}
  {%- if edate >= today -%}
    {%- assign shown = shown | plus: 1 -%}
    <li class="sub-event">
      <a href="{{ e.url | relative_url }}">
        <span class="sub-event-date">{{ e.date | date: "%a %-d %b" }}</span>
        <span class="sub-event-title">{{ e.title }}</span>
        <span class="sub-event-meta">{% if e.start %}{{ e.start }}{% if e.end %}–{{ e.end }}{% endif %} · {% endif %}{{ e.location }}</span>
      </a>
    </li>
  {%- endif -%}
{%- endfor -%}
</ul>
{%- if shown == 0 -%}
<p class="sub-empty">Nothing on the calendar right now — but we run these regularly. Subscribe above and you'll get new dates automatically.</p>
{%- endif -%}

<p class="sub-back"><a href="{{ '/' | relative_url }}">← Back to salsalastyle.dk</a></p>

<style>
  .sub-lede { font-size: 1.1rem; line-height: 1.5; margin: 0 0 1.5rem; }
  .sub-actions { margin: 0 0 2.5rem; }
  .sub-btn { font-size: 1.05rem; cursor: pointer; border: none; }
  .sub-alt { font-size: .9rem; opacity: .8; margin: .9rem 0 0; }
  .sub-alt a { text-decoration: underline; }
  .sub-inapp { margin: 1rem 0 0; padding: .7rem .9rem; border-radius: 8px; background: rgba(200,120,0,.12); border: 1px solid rgba(200,120,0,.4); font-size: .9rem; line-height: 1.4; }
  .sub-heading { margin: 0 0 1rem; }
  .sub-events { list-style: none; padding: 0; margin: 0; }
  .sub-event { border-top: 1px solid rgba(128,128,128,.25); }
  .sub-event:last-child { border-bottom: 1px solid rgba(128,128,128,.25); }
  .sub-event a { display: grid; grid-template-columns: 6.5rem 1fr; gap: .1rem 1rem; align-items: baseline; padding: .9rem .25rem; text-decoration: none; color: inherit; }
  .sub-event a:hover { background: rgba(128,128,128,.06); }
  .sub-event-date { grid-row: 1 / span 2; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; font-size: .8rem; opacity: .75; }
  .sub-event-title { font-weight: 600; }
  .sub-event-meta { font-size: .85rem; opacity: .7; }
  .sub-empty { opacity: .75; }
  .sub-back { margin-top: 2.5rem; font-size: .9rem; }
</style>

<script>
  (function () {
    // Instagram / Facebook in-app browsers block .ics/webcal handoffs — warn
    // only those users to reopen in a real browser.
    if (/Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent || "")) {
      var note = document.getElementById('subInApp');
      if (note) note.hidden = false;
    }

    var btn = document.getElementById('subAll');
    if (!btn) return;
    var feed = '{{ '/events/all.ics' | prepend: site.url }}';
    btn.addEventListener('click', function () {
      if (window.SLSAddCal && window.SLSAddCal.subscribe) {
        window.SLSAddCal.subscribe(feed);
      } else {
        // Fallback if the helper didn't load: webcal handoff.
        window.location.href = feed.replace(/^https?:\/\//i, 'webcal://');
      }
    });
  })();
</script>
