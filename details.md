---
layout: page
seo_title: "Your details · Salsa LA-Style"
noindex: true
description: "Confirm your details for Salsa LA-Style."
---

<script>
document.addEventListener('DOMContentLoaded', function () {
    // Paste the /exec URL of the "Details collection" Apps Script deployment here.
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwPU7vTAG_CEWclooKkGLJu8uw1tHvtLpVxRW6ik-EZa1d6UkoaNT5aqNCfHk4cV7uK/exec';

    const token   = new URLSearchParams(window.location.search).get('t') || '';
    const loading = document.getElementById('loadingState');
    const invalid = document.getElementById('invalidState');
    const unreach = document.getElementById('unreachableState');
    const form    = document.getElementById('detailsForm');
    const done    = document.getElementById('doneState');
    const errorBox = document.getElementById('errorMessage');

    function show(el) {
        [loading, invalid, unreach, form, done].forEach(function (n) {
            n.style.display = 'none';
        });
        el.style.display = 'block';
    }

    if (!token) { show(invalid); return; }

    // Same transport as the registration forms: a plain POST with no custom
    // headers, so the browser sends no CORS preflight.
    //
    // The timeout matters more than it looks. Without it, anything that stops
    // the request from settling — a content blocker, a captive portal, a phone
    // dropping off wifi mid-request — leaves the visitor staring at "One
    // moment…" forever with nothing to act on, and we never hear about it.
    // A request that cannot finish is treated as unreachable, which is a
    // different thing from a link that is not valid, and says so.
    function call(payload, timeoutMs) {
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs || 15000);
        return fetch(SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify(payload),
                signal: controller.signal
            })
            .then(function (r) { return r.text(); })
            .then(function (t) {
                clearTimeout(timer);
                try {
                    return JSON.parse(t);
                } catch (e) {
                    // A non-JSON body means we reached something, but not our
                    // script — a sign-in wall or an error page.
                    var err = new Error('unexpected response');
                    err.unreachable = true;
                    throw err;
                }
            })
            .catch(function (e) {
                clearTimeout(timer);
                e.unreachable = true;
                throw e;
            });
    }

    function lookup() {
        show(loading);
        call({ action: 'lookup', token: token })
            .then(function (data) {
                if (data.result !== 'success') { show(invalid); return; }
                document.getElementById('personName').textContent = data.name;
                if (data.completed) {
                    document.getElementById('alreadyNote').style.display = 'block';
                }
                show(form);
            })
            .catch(function () { show(unreach); });
    }

    document.getElementById('retryButton').addEventListener('click', lookup);
    lookup();

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

    <div id="unreachableState" style="display:none">
        <h1>We couldn't load your details</h1>
        <p>
            The connection to our system didn't go through. This is usually a
            temporary network problem, or a browser extension blocking the
            request — it isn't anything you did wrong.
        </p>
        <p>
            <button type="button" id="retryButton">Try again</button>
        </p>
        <p class="details-hint">
            If it keeps happening, try opening the link in a different browser,
            or just reply to the email and we'll take your details that way.
        </p>
        <div class="back-link"><a href="/">← Back to the website</a></div>
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
            for participants under 30. To apply that exemption, the Danish Tax Agency
            requires us to be able to document each participant's full name, address
            and date of birth — so all three are part of the record we have to keep,
            and the address is not an extra we've added on top.
        </p>
        <p class="details-hint">
            We keep this with your class records and don't share it with anyone
            outside the services we need to run the school. You can ask us to correct
            it at any time. We can't delete it on request while the tax rules require
            us to keep it — five years — and we delete it after that. Email
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
