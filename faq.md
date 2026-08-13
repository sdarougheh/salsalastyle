---
layout: page
title: FAQ
---

{% for item in site.data.faq %}
## {{ item.q }}

{{ item.a }}

{% endfor %}
## Still not sure?

[Get in touch](/contact) — we're happy to help you figure out which class fits.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {%- for item in site.data.faq -%}
    {
      "@type": "Question",
      "name": {{ item.q | jsonify }},
      "acceptedAnswer": { "@type": "Answer", "text": {{ item.a | jsonify }} }
    }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor -%}
  ]
}
</script>
