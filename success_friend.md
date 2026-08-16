---
layout: page
title: Registration
noindex: true
---

{%- assign fd = site.friend_discount -%}
{%- assign keep = 100 | minus: fd.percent -%}
{%- assign per_person = fd.base | times: keep | divided_by: 100 -%}
{%- assign total = per_person | times: 2 -%}

<h3>Success — you're both signed up</h3>

<p>
We've registered both of you for the Beginners class ({{ site.season.name }}), with
{{ fd.percent }}% off each — <strong>{{ per_person }} DKK per person</strong>.
</p>

<div class="pair-total">
  <span>One payment for both of you</span>
  <strong>{{ total }} DKK</strong>
</div>

<p>
Your registration is only valid after payment. Mobile pay <strong>{{ total }} DKK</strong> —
the total for both of you, in <strong>one</strong> payment — to
Box {{ site.mobilepay.classes.box }} (<a href="{{ site.mobilepay.classes.url }}" target="_blank">link</a>).
Please don't pay separately: the pair price only applies when the two of you are paid for together.
</p>

<p id="pairRef" class="pair-ref" style="display:none">
  Please write this reference in the MobilePay comment: <strong id="pairRefValue"></strong>
</p>

<script>
// The pair id comes back from the registration form as ?ref= — it lets us match
// your payment to the two of you in one go.
(function () {
  var m = /[?&]ref=([^&]+)/.exec(window.location.search);
  if (!m) return;
  document.getElementById('pairRefValue').textContent = decodeURIComponent(m[1]);
  document.getElementById('pairRef').style.display = '';
})();
</script>

<p>
Want to add another class on top? Head back to <a href="/registration">registration</a> —
extra classes are booked individually at the normal price.
</p>

{% include class_prices.html %}
