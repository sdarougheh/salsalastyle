---
layout: page
title: "Register for the beginner classes"
seo_title: "Salsa LA-Style · Register for the beginner classes"
lede: "Register for our Copenhagen beginners salsa class — no experience and no partner needed."
---

{%- assign fd = site.friend_discount -%}
{%- assign keep = 100 | minus: fd.percent -%}
{%- assign per_person = fd.base | times: keep | divided_by: 100 -%}
{%- assign total = per_person | times: 2 -%}
{%- assign single = site.data.pricing | where_exp: "p", "p.pkg contains 'Single'" | first -%}

<script>
document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydCteT3pBhhTvomKF-GKod2stQnLnzxjRr00_KREKHfwNtuSKdePey6UItp_navUTp/exec';

    // This form only ever registers one class, so there is nothing to choose.
    // The value must match what the sheet already uses for the beginners class.
    const BEGINNER_CLASS = {{ fd.class | jsonify }};

    // Dancing role is deliberately not asked here. It is jargon a first-timer
    // does not have, on a page that promises no experience is needed, and we
    // sort roles out in class anyway. The field is still sent so the payload
    // shape matches the normal registration form and the sheet stays aligned.
    const ROLE = '';

    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');

        errorMessage.style.display = 'none';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        grecaptcha.ready(function() {
            grecaptcha.execute('6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3', {action: 'submit'}).then(function(token) {

                const formData = {
                    name: document.getElementById('name').value,
                    young: document.getElementById('young').checked ? 'Yes' : 'No',
                    email: document.getElementById('email').value,
                    classes: [BEGINNER_CLASS],
                    role: ROLE,
                    comments: document.getElementById('comments').value,
                    referral: window.SLSReferral || '',
                    recaptchaToken: token
                };

                // Submit without Content-Type to avoid CORS preflight
                fetch(SCRIPT_URL, {
                    method: 'POST',
                    body: JSON.stringify(formData)
                })
                .then(response => response.text())
                .then(text => {
                    const data = JSON.parse(text);
                    if (data.result === 'success') {
                        // Fire analytics events on confirmed success (non-PII only).
                        try {
                            window.dataLayer = window.dataLayer || [];
                            window.dataLayer.push({
                                event: 'registration_submit',
                                registration_type: 'beginner',
                                classes: [BEGINNER_CLASS],
                                participants: 1,
                                young_student: document.getElementById('young').checked,
                                referral: window.SLSReferral || ''
                            });
                            if (window.gtag) window.gtag('event', 'sign_up', {
                                method: 'class_beginner',
                                referral: window.SLSReferral || ''
                            });
                        } catch (e) { /* analytics push must not block redirect */ }
                        window.location.href = 'success.html';
                    } else {
                        throw new Error(data.error || 'Submission failed');
                    }
                })
                .catch(function(error) {
                    console.error('Full error:', error);
                    errorMessage.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register for the beginners class';
                });

            }).catch(function(error) {
                errorMessage.style.display = 'block';
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register for the beginners class';
            });
        });
    });
});
</script>

<script src="https://www.google.com/recaptcha/api.js?render=6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3"></script>

<div class="registration-container">
    <p class="pair-intro">
        For absolute first-timers — <strong>no experience needed, no partner needed</strong>.
        Just fill in your name and email below.
    </p>

    <div class="form-group">
        <label>Class</label>
        <div class="pair-class">
            Beginners — Wednesdays 19:00–20:00 ({{ site.season.name }}, {{ site.season.dates }})
        </div>
    </div>

    <div id="errorMessage" class="error">
        Something went wrong. Please try again.
    </div>

    <form id="registrationForm">
        <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required>
        </div>

        <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required>
        </div>

        <div class="form-group">
            <label>
                <input type="checkbox" id="young" name="young">
                I am under 30 years old.
            </label>
        </div>

        <div class="form-group">
            <label for="comments">Comments or questions</label>
            <textarea id="comments" name="comments"></textarea>
        </div>

        <div class="pair-total">
            <span>Price for the 8-week course</span>
            <strong>{{ single.regular }}<span class="pair-total-alt">{{ single.student }} for students</span></strong>
        </div>

        <p>By registering, you accept our <a href="/terms" target="_blank">Terms and Conditions</a>.</p>

        <button type="submit" id="submitBtn">Register for the beginners class</button>
    </form>

    <p class="pair-intro">
        Coming with someone? Sign up together on the
        <a href="/registration_friend">with-a-friend form</a> and you both pay
        {{ per_person }} DKK instead of {{ fd.base }}.
    </p>

    <div class="back-link">
        <a href="/beginner/">← Back to the beginners class</a>
    </div>
</div>
