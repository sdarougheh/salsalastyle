---
layout: page
seo_title: "Your details · Salsa LA-Style"
noindex: true
description: "Confirm your details for Salsa LA-Style."
---

<script>
document.addEventListener('DOMContentLoaded', function () {
    // Paste the /exec URL of the "Details collection" Apps Script deployment here.
    const SCRIPT_URL = 'PASTE_DETAILS_SCRIPT_URL_HERE';

    const token   = new URLSearchParams(window.location.search).get('t') || '';
    const loading = document.getElementById('loadingState');
    const invalid = document.getElementById('invalidState');
    const form    = document.getElementById('detailsForm');
    const done    = document.getElementById('doneState');
    const errorBox = document.getElementById('errorMessage');

    function show(el) {
        [loading, invalid, form, done].forEach(function (n) { n.style.display = 'none'; });
        el.style.display = el === form ? 'block' : 'block';
    }

    if (!token) { show(invalid); return; }

    // Same transport as the registration forms: a plain POST with no custom
    // headers, so the browser sends no CORS preflight.
    function call(payload) {
        return fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) })
            .then(function (r) { return r.text(); })
            .then(function (t) { return JSON.parse(t); });
    }

    call({ action: 'lookup', token: token })
        .then(function (data) {
            if (data.result !== 'success') { show(invalid); return; }
            document.getElementById('personName').textContent = data.name;
            if (data.completed) {
                document.getElementById('alreadyNote').style.display = 'block';
            }
            show(form);
        })
        .catch(function () { show(invalid); });

    document.getElementById('detailsFormEl').addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        errorBox.style.display = 'none';
        btn.disabled = true;
        btn.textContent = 'Sending…';

        call({
            action:   'save',
            token:    token,
            dob:      document.getElementById('dob').value,
            street:   document.getElementById('street').value.trim(),
            postcode: document.getElementById('postcode').value.trim(),
            city:     document.getElementById('city').value.trim()
        })
        .then(function (data) {
            if (data.result === 'success') { show(done); }
            else { throw new Error(data.error || 'failed'); }
        })
        .catch(function () {
            errorBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Submit';
        });
    });
});
</script>

<div class="registration-container">

    <div id="loadingState">
        <p>One moment…</p>
    </div>

    <div id="invalidState" style="display:none">
        <h1>This link isn't valid</h1>
        <p>
            The link may have been copied incompletely — it needs everything after
            the <code>?</code> as well. If it still doesn't work, reply to the email
            you received and we'll send you a new one.
        </p>
        <div class="back-link"><a href="/">← Back to the website</a></div>
    </div>

    <div id="detailsForm" style="display:none">
        <h1>To comply with Danish tax law, we need the following information from you</h1>

        <div id="alreadyNote" class="field-error" style="display:none">
            We already have your details. Submitting again replaces them.
        </div>

        <div class="form-group">
            <label>This is you</label>
            <p id="personName" class="details-name"></p>
            <p class="details-hint">
                If this isn't your name, don't fill in the form — reply to the email instead.
            </p>
        </div>

        <div id="errorMessage" class="error">
            Something went wrong. Please try again.
        </div>

        <form id="detailsFormEl">
            <div class="form-group">
                <label for="dob">Date of birth *</label>
                <input type="date" id="dob" name="dob" required>
            </div>

            <div class="form-group">
                <label for="street">Street and number *</label>
                <input type="text" id="street" name="street" autocomplete="street-address" required>
            </div>

            <div class="form-group">
                <label for="postcode">Postcode *</label>
                <input type="text" id="postcode" name="postcode" inputmode="numeric" autocomplete="postal-code" required>
            </div>

            <div class="form-group">
                <label for="city">City *</label>
                <input type="text" id="city" name="city" autocomplete="address-level2" required>
            </div>

            <button type="submit" id="submitBtn">Submit</button>
        </form>

        <p class="details-hint">
            <strong>Why we're asking.</strong> Danish VAT rules exempt dance teaching
            for participants under 30, and to apply that exemption we have to be able
            to document each participant's age — that's what the date of birth is for.
            The address is not required by the tax rules; we use it to work out which
            parts of Copenhagen our students travel from, so we can choose venues and
            class times sensibly.
        </p>
        <p class="details-hint">
            We keep this with your class records and don't share it with anyone
            outside the services we need to run the school. You can ask us to correct
            or delete it at any time by emailing
            <a href="mailto:salsalastyledk@gmail.com">salsalastyledk@gmail.com</a>.
            See our <a href="/privacy" target="_blank">privacy policy</a> for the full
            detail, including how long we keep it and how to complain.
        </p>
    </div>

    <div id="doneState" style="display:none">
        <h1>Thank you so much for helping us</h1>
        <div class="back-link"><a href="/">← Back to the website</a></div>
    </div>

</div>
