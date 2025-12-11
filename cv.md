---
layout: resume
title: CV
---


<div class="cv">
        <header class="section-header">
          <h3>    CV</h3>
        </header>



<h3>Appointments</h3>

  {% for appointment in site.data.cv.Appointments %}
  {{appointment.title}}, {{appointment.place}}, {{appointment.time}} <br>
  {% endfor %}
  
<h3>Education</h3>
  
<ul class="empty-list">
    {% for educ in site.data.cv.Education %}
  <li>{{educ.what}}, {{educ.where}}, {{educ.when}} 
  {% if educ.thesis %}
  <br><span class=indent>Thesis: "{{ educ.thesis }}"</span>
  {% endif %}
</li> 
  {% endfor %}
</ul>
  
  
<h3>Publications</h3>
  <ul>
  {% for publication in site.data.publications.papers %}
  <li>{{publication.title}} {% if publication.authors %} (with {{publication.authors}}){% endif %}</li>
  {% endfor %}

</ul>
  
  
<h3>Working papers</h3>
  <ul>
  {% for publication in site.data.workingpapers.papers %}
    <li>{{publication.title}}  {% if publication.authors %} (with {{publication.authors}} ){% endif %}</li>
  {% endfor %}
</ul>

  
  

  
  
<h3>Presentations</h3>
  <ul class="empty-list">
 
  {% for pres in site.data.cv.Presentations %}
  <li><b>{{pres.year}}</b>: {{pres.where}} </li>
  {% endfor %}
</ul>
  
  
   
<h3>Professional activities</h3>
  <ul class="empty-list">
<li><b>Referee</b>: {% for ref in site.data.cv.Referee %} {{ref.where}} {% endfor %}<br></li>
<li><b>Discussion</b>: 
  {% for disc in site.data.cv.Discussions %}
  {{disc.year}}: {{disc.where}}.
  {% endfor %}
</li>  
</ul>
    
<h3>Grants</h3>
  <ul class="empty-list">
  {% for grant in site.data.cv.Grants %}
  <li><b>{{grant.year}}</b>: {{grant.what}} </li>
  {% endfor %}
  </ul>
 <h3>Teaching</h3>
  <ul class="empty-list">
  {% for teach in site.data.cv.Teaching %}
    <li><b>{{teach.year}}</b>: {{teach.what}} </li>
  {% endfor %}
    </ul>
</div>