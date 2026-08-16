---
layout: page
title: Payments
lede: "Prices for our Copenhagen salsa classes, and how to pay by MobilePay."
---

{%- assign fd = site.friend_discount -%}
{%- assign keep = 100 | minus: fd.percent -%}
{%- assign per_person = fd.base | times: keep | divided_by: 100 -%}
{%- assign pair_total = per_person | times: 2 -%}

For payment, please mobile pay the correct amount to
Box {{ site.mobilepay.classes.box }} (<a href="{{ site.mobilepay.classes.url }}" target="_blank">link</a>).

<p>
<strong>One payment per person</strong> — if you're signing up several people, please
pay separately for each of them.
{% if fd.enabled %}
The one exception is the <strong>With a Friend</strong> price below: you and your friend
pay {{ pair_total }} DKK in a single payment for the two of you.
{% endif %}
</p>

{% include class_prices.html %}
