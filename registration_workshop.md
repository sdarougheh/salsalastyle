---
layout: page
title: Registration
---

<script>
document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydCteT3pBhhTvomKF-GKod2stQnLnzxjRr00_KREKHfwNtuSKdePey6UItp_navUTp/exec';
    
    // The under-30 box is both a price claim and a tax-documentation trigger:
    // SKAT requires a full name, address and date of birth to evidence the
    // exemption, so those fields appear exactly when the box is ticked. They
    // are required while visible and cleared when hidden, so an untick never
    // leaves behind a date of birth someone typed and then thought better of
    // - and a hidden field is never `required`, which browsers refuse to
    // validate because they cannot focus it.
    // A date input always hands back YYYY-MM-DD in `.value`, whatever the
    // browser shows the person (dd/mm/yyyy here, mm/dd/yyyy for an American
    // visitor), so what we post is never ambiguous. The cap is set here rather
    // than in the markup so it is today's date, not the date of the last build.
    const dobField = document.getElementById('dob');
    dobField.max = new Date().toISOString().slice(0, 10);

    const youngBox = document.getElementById('young');
    const youngDetails = document.getElementById('youngDetails');
    const youngFields = ['dob', 'street', 'postcode', 'city'].map(function(id) {
        return document.getElementById(id);
    });

    function syncYoungDetails() {
        const wanted = youngBox.checked;
        youngDetails.hidden = !wanted;
        youngFields.forEach(function(field) {
            field.required = wanted;
            if (!wanted) field.value = '';
        });
    }

    youngBox.addEventListener('change', syncYoungDetails);
    syncYoungDetails();

    document.getElementById('registrationForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');
        const classError = document.getElementById('classError');
        
        // Hide error messages
        errorMessage.style.display = 'none';
        classError.style.display = 'none';
        
        // Get selected classes
        const classCheckboxes = document.querySelectorAll('input[name="class"]:checked');
        const selectedClasses = Array.from(classCheckboxes).map(cb => cb.value);
        
        // Validate at least one class selected
        if (selectedClasses.length === 0) {
            classError.style.display = 'block';
            return;
        }
        
        // Disable button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';
        
        // Execute reCAPTCHA
        grecaptcha.ready(function() {
            grecaptcha.execute('6LcOef4tAAAAAAgmxguJSyuVZx1XLUriNqRkBkE4', {action: 'submit'}).then(function(token) {
                
                // Get form data
                const formData = {
                    name: document.getElementById('name').value,
                    young: document.getElementById('young').checked ? 'Yes' : 'No',
                    email: document.getElementById('email').value,
                    classes: selectedClasses,
                    role: document.getElementById('role').value,
                    comments: document.getElementById('comments').value,
                    dob: document.getElementById('dob').value,
                    street: document.getElementById('street').value,
                    postcode: document.getElementById('postcode').value,
                    city: document.getElementById('city').value,
                    recaptchaToken: token
                };
                
                // Submit without Content-Type to avoid CORS preflight
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                .then(response => {
                    console.log('Response status:', response.status);
                    return response.text();
                })
                .then(text => {
                    console.log('Response text:', text);
                    const data = JSON.parse(text);
                    console.log('Parsed data:', data);
                    if (data.result === 'success') {
                        // Fire GTM event on confirmed success (non-PII payload only).
                        try {
                            window.dataLayer = window.dataLayer || [];
                            window.dataLayer.push({
                                event: 'registration_workshop_submit',
                                classes: selectedClasses,
                                role: document.getElementById('role').value,
                                young_student: document.getElementById('young').checked
                            });
                        } catch (e) { /* analytics push must not block redirect */ }
                        window.location.href = 'success_workshop.html';
                    } else {
                        throw new Error(data.error || 'Submission failed');
                    }
                })
                .catch(function(error) {
                    console.error('Full error:', error);
                    errorMessage.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Registration';
                });
                
            }).catch(function(error) {
                errorMessage.style.display = 'block';
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Registration';
            });
        });
    });
});
</script>

<script src="https://www.google.com/recaptcha/api.js?render=6LcOef4tAAAAAAgmxguJSyuVZx1XLUriNqRkBkE4"></script>

<div class="registration-container">
    <h1>Workshop Registration</h1>

    <div id="errorMessage" class="error">
        Something went wrong. Please try again.
    </div>
    
    <form id="registrationForm">
        <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group checkbox-group">
            <label>
                <input type="checkbox" id="young" name="young">
                I am under 30 years old.
            </label>
        </div>

        <!-- Under-30 details. Danish VAT rules exempt dance teaching for
             participants under 30, and SKAT requires a full name, address and
             date of birth to evidence the exemption - so these fields appear
             only for the people the exemption applies to, and only once they
             say so. The container deliberately carries no `display` rule of
             its own: that is what lets the plain `hidden` attribute hide it. -->
        <div id="youngDetails" class="young-details" hidden>
            <p class="role-notice">
                Danish VAT rules exempt dance teaching for participants under 30. To apply that
                exemption we need to document your birthday and current living address.
            </p>

            <div class="form-group">
                <label for="dob">Date of birth *</label>
                <input type="date" id="dob" name="dob" min="1900-01-01" autocomplete="bday">
            </div>

            <div class="form-group">
                <label for="street">Street and number *</label>
                <input type="text" id="street" name="street" autocomplete="street-address">
            </div>

            <div class="form-group field-row">
                <div>
                    <label for="postcode">Postcode *</label>
                    <input type="text" id="postcode" name="postcode" inputmode="numeric" autocomplete="postal-code">
                </div>
                <div>
                    <label for="city">City *</label>
                    <input type="text" id="city" name="city" autocomplete="address-level2">
                </div>
            </div>
        </div>
        
        <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label>Which classes? (select all that apply) *</label>
            <div class="checkbox-list">
  {%- assign NL = "
" -%}
  {%- assign today = site.time | date: "%Y-%m-%d" -%}
  {% assign workshops = site.events | where: "type", "workshop" | sort: "date" %}
  {% for workshop in workshops %}{%- assign wsdate = workshop.date | date: "%Y-%m-%d" -%}{% unless workshop.hidden %}{% if wsdate >= today %}
                {%- capture wsdesc -%}{{ workshop.calendar_description | default: workshop.lede }}{%- endcapture -%}
                {%- assign wsdesc = wsdesc | replace: NL, "[br]" -%}
                <div class="ws-option" data-ws-date="{{ wsdate }}">
                  <div class="ws-option-head">
                    <span class="ws-option-title">{{ workshop.title }} ({{ workshop.date | date: "%Y-%m-%d" }}){% if workshop.register_url %} — <a href="{{ workshop.url }}">details</a>{% endif %}</span>
                    <button type="button" class="cal-btn ws-cal" data-addcal aria-label="Add {{ workshop.title }} to calendar">
                      <span class="ws-cal-text">Add to calendar</span><span class="cal-emoji" role="img" aria-hidden="true">📅</span>
                    </button>
                    <script type="application/json" class="addcal-config">
                    {
                      "name": {{ workshop.calendar_title | default: workshop.title | jsonify }},
                      "description": {{ wsdesc | jsonify }},
                      "startDate": "{{ workshop.date | date: '%Y-%m-%d' }}",
                      "startTime": "{{ workshop.start }}",
                      "endDate": "{{ workshop.date | date: '%Y-%m-%d' }}",
                      "endTime": "{{ workshop.end }}",
                      "timeZone": "Europe/Copenhagen",
                      "location": {{ workshop.location | jsonify }}{% if workshop.ref %},
                      "icsFile": "{{ site.url }}/events/{{ workshop.ref }}.ics"{% endif %}
                    }
                    </script>
                  </div>
                  <div class="ws-option-choices">
                    {% if workshop.signup_options %}{% for opt in workshop.signup_options %}
                    <label><input type="checkbox" name="class" value="{{ opt.value }}"> {{ opt.label }}</label>
                    {% endfor %}{% else %}
                    <label><input type="checkbox" name="class" value="{{ workshop.title }}"> Sign me up</label>
                    {% endif %}
                  </div>
                </div>
  {% endif %}{% endunless %}{% endfor %}
            </div>
            <p class="ws-empty" hidden>No workshops are on the calendar right now. <a href="{{ '/events/' | relative_url }}">Subscribe to our events</a> and you'll hear about the next one automatically.</p>
            <div id="classError" class="field-error">Please select at least one class</div>
        </div>
        
        <div class="form-group">
            <label for="role">Dancing role *</label>
            <select id="role" name="role" required>
                <option value="">-- Select a role --</option>
                <option value="Lead">Lead</option>
                <option value="Follow">Follow</option>
                <option value="Either">Either role</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="comments">Comments or questions</label>
            <textarea id="comments" name="comments"></textarea>
        </div>
        <p>By registering, you accept our <a href="/terms" target="_blank">Terms and Conditions</a>.</p>
        
        <button type="submit" id="submitBtn">Submit Registration</button>
    </form>
    
    <div class="back-link">
        <a href="/#events">← Back to events</a>
    </div>
</div>

<script>
// Liquid filters past workshops out at build time, but the site is only
// rebuilt on push — so re-check against the visitor's own "today" here, the
// same way the homepage event cards do. Without this a workshop keeps showing
// up as bookable for every day between its date and the next deploy.
(function () {
  const d = new Date();
  const today = d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");

  const list = document.querySelector('.checkbox-list');
  if (!list) return;

  list.querySelectorAll('.ws-option[data-ws-date]').forEach(function (row) {
    if (row.getAttribute('data-ws-date') < today) row.remove();
  });

  if (!list.querySelector('.ws-option')) {
    const empty = document.querySelector('.ws-empty');
    if (empty) empty.hidden = false;
    const btn = document.getElementById('submitBtn');
    if (btn) btn.hidden = true;
  }
})();

(function () {
  document.querySelectorAll('.ws-option').forEach(function (row) {
    var btn = row.querySelector('[data-addcal]');
    var cfgEl = row.querySelector('.addcal-config');
    if (!btn || !cfgEl) return;
    var cfg = JSON.parse(cfgEl.textContent);
    btn.addEventListener('click', function () {
      if (window.SLSAddCal) window.SLSAddCal.open(cfg);
    });
  });
})();
</script>