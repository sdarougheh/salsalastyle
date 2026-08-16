---
layout: page
title: Meet your teachers
seo_title: "Meet your teachers · Salsa LA-Style Copenhagen"
lede: "The three teachers behind Salsa LA-Style Copenhagen: Saman, Helena and Nuria, and which Wednesday class each of them teaches."
---

{% assign t = site.data.teachers %}

<p class="teachers-intro">{{ t.intro }}</p>

<div class="teachers-pairs">
  {% for p in t.pairs %}
  <figure class="teacher-pair kind-{{ p.kind }}">
    <div class="teacher-pair-photo">
      <img src="{{ p.photo | relative_url }}" alt="{{ p.alt }}" width="900" height="1203" loading="lazy">
    </div>
    <figcaption class="teacher-pair-caption">
      <span class="teacher-pair-chip">{{ p.class_label }}</span>
      <span class="teacher-pair-names">{{ p.names }}</span>
      <span class="teacher-pair-time">{{ p.time }}</span>
    </figcaption>
  </figure>
  {% endfor %}
</div>

<div class="teacher-bios">
  {% for person in t.people %}
  <div class="teacher-bio">
    <h2 class="teacher-bio-name">{{ person.name }}</h2>
    <div class="teacher-bio-tags">
      {% for tag in person.tags %}
      <span class="teacher-tag kind-{{ tag.kind }}">{{ tag.label }}</span>
      {% endfor %}
    </div>
    <p class="teacher-bio-text">{{ person.bio }}</p>
  </div>
  {% endfor %}
</div>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "DanceSchool",
  "name": "Salsa LA-Style",
  "url": "{{ site.url }}",
  "employee": [
    {%- for person in site.data.teachers.people -%}
    {
      "@type": "Person",
      "name": {{ person.name | jsonify }},
      "jobTitle": "Salsa Instructor",
      "description": {{ person.bio | strip_newlines | strip | jsonify }}
    }{%- unless forloop.last -%},{%- endunless -%}
    {%- endfor -%}
  ]
}
</script>
