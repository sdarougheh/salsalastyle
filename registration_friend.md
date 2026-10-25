---
layout: page
title: Registration
seo_title: "Salsa LA-Style · Sign up with a friend"
lede: "Sign up for our Copenhagen beginners salsa class together with a friend and you both get 20% off."
---

{%- assign fd = site.friend_discount -%}
{%- assign keep = 100 | minus: fd.percent -%}
{%- assign per_person = fd.base | times: keep | divided_by: 100 -%}
{%- assign total = per_person | times: 2 -%}

<script>
document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydCteT3pBhhTvomKF-GKod2stQnLnzxjRr00_KREKHfwNtuSKdePey6UItp_navUTp/exec';

    // Both people are registered in a single submission, so the two rows in the
    // sheet always share one pair id and one payment.
    const PAIR_CLASS  = {{ fd.class | jsonify }};
    const PAIR_AMOUNT = {{ total }};

    document.getElementById('registrationForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitBtn');
        const errorMessage = document.getElementById('errorMessage');
        const emailError = document.getElementById('emailError');

        errorMessage.style.display = 'none';
        emailError.style.display = 'none';

        // Dancing role is deliberately not asked. It is jargon a first-timer does
        // not have, and we rotate partners in class anyway. The key is still sent
        // so the payload shape matches the other registration forms.
        const people = [1, 2].map(function (n) {
            return {
                name:  document.getElementById('name' + n).value.trim(),
                email: document.getElementById('email' + n).value.trim(),
                role:  ''
            };
        });

        // Two different people, so two different email addresses — otherwise
        // one of them never gets the confirmation.
        if (people[0].email.toLowerCase() === people[1].email.toLowerCase()) {
            emailError.style.display = 'block';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying...';

        grecaptcha.ready(function() {
            grecaptcha.execute('6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3', {action: 'submit'}).then(function(token) {

                const formData = {
                    type: 'pair',
                    classes: [PAIR_CLASS],
                    discount: '{{ fd.percent }}%',
                    amount: PAIR_AMOUNT,
                    currency: 'DKK',
                    people: people,
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
                                registration_type: 'pair',
                                classes: [PAIR_CLASS],
                                participants: 2,
                                value: PAIR_AMOUNT,
                                currency: 'DKK',
                                referral: window.SLSReferral || ''
                            });
                            if (window.gtag) window.gtag('event', 'sign_up', {
                                method: 'class_pair',
                                value: PAIR_AMOUNT,
                                currency: 'DKK',
                                referral: window.SLSReferral || ''
                            });
                        } catch (e) { /* analytics push must not block redirect */ }
                        // The pair id (from the sheet) doubles as the payment
                        // reference, so pass it along to the success page.
                        const ref = data.pairId ? ('?ref=' + encodeURIComponent(data.pairId)) : '';
                        window.location.href = 'success_friend.html' + ref;
                    } else {
                        throw new Error(data.error || 'Submission failed');
                    }
                })
                .catch(function(error) {
                    console.error('Full error:', error);
                    errorMessage.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register us both';
                });

            }).catch(function(error) {
                errorMessage.style.display = 'block';
                console.error('Error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register us both';
            });
        });
    });
});
</script>

<script src="https://www.google.com/recaptcha/api.js?render=6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3"></script>

<div class="registration-container">
    <h1>Sign up with a friend</h1>

    <div class="pair-banner">
        <div class="pair-banner-badge">−{{ fd.percent }}%</div>
        <div>
            <strong>Beginners class only.</strong>
            Sign up together with a friend and you both get {{ fd.percent }}% off —
            <strong>{{ per_person }} DKK each, {{ total }} DKK for the two of you</strong>
            for the full {{ site.season.name }} course (Wednesdays 19:00, {{ site.season.dates }}).
            That's cheaper than the student price, whatever your age.
        </div>
    </div>

    <p class="pair-intro">
        Fill in both of you below — this one form registers you both, and one
        person pays {{ total }} DKK for the pair.
        Signing up on your own instead? Use the <a href="/registration">normal registration form</a>.
    </p>

    <div id="errorMessage" class="error">
        Something went wrong. Please try again.
    </div>

    <form id="registrationForm">
        <fieldset class="pair-person">
            <legend>Person 1</legend>

            <div class="form-group">
                <label for="name1">Full Name *</label>
                <input type="text" id="name1" name="name1" required>
            </div>

            <div class="form-group">
                <label for="email1">Email *</label>
                <input type="email" id="email1" name="email1" required>
            </div>
        </fieldset>

        <fieldset class="pair-person">
            <legend>Person 2</legend>

            <div class="form-group">
                <label for="name2">Full Name *</label>
                <input type="text" id="name2" name="name2" required>
            </div>

            <div class="form-group">
                <label for="email2">Email *</label>
                <input type="email" id="email2" name="email2" required>
                <div id="emailError" class="field-error">Please give each person their own email address</div>
            </div>
        </fieldset>

        <div class="form-group">
            <label>Class</label>
            <div class="pair-class">Beginners — Wednesday 19:00 ({{ site.season.name }})</div>
        </div>

        <div class="form-group">
            <label for="comments">Comments or questions</label>
            <textarea id="comments" name="comments"></textarea>
        </div>

        <div class="pair-total">
            <span>Total for both of you</span>
            <strong>{{ total }} DKK</strong>
        </div>

        <p>By registering, you both accept our <a href="/terms" target="_blank">Terms and Conditions</a>.</p>

        <button type="submit" id="submitBtn">Register us both</button>
    </form>

    <div class="back-link">
        <a href="/beginner/">← Back to the beginners class</a>
    </div>
</div>
