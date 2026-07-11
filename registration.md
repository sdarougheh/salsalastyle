---
layout: page
title: Registration
---

<script>
document.addEventListener('DOMContentLoaded', function() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydCteT3pBhhTvomKF-GKod2stQnLnzxjRr00_KREKHfwNtuSKdePey6UItp_navUTp/exec';
    
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
            grecaptcha.execute('6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3', {action: 'submit'}).then(function(token) {
                
                // Get form data
                const formData = {
                    name: document.getElementById('name').value,
                    young: document.getElementById('young').checked ? 'Yes' : 'No',
                    email: document.getElementById('email').value,
                    classes: selectedClasses,
                    role: document.getElementById('role').value,
                    comments: document.getElementById('comments').value,
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
                                event: 'registration_submit',
                                classes: selectedClasses,
                                role: document.getElementById('role').value,
                                young_student: document.getElementById('young').checked
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

<script src="https://www.google.com/recaptcha/api.js?render=6Ld7gCcsAAAAAFgmvwijHhrD3avqOOSuAwjVn_A3"></script>

<div class="registration-container">
    <h1>Class Registration</h1>

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
        
        <div class="form-group">
            <label for="email">Email *</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label>Which classes? (you can select multiple, but don't need to register again for classes you already registered for earlier.) *</label>
            <div class="checkbox-list">
                <label><input type="checkbox" name="class" value="Beginners Autumn"> Beginners - Wednesday 19:00</label>
                <label><input type="checkbox" name="class" value="Intermediate 1 Autumn"> Intermediate 1 - Wednesday 20:00</label>
                <label><input type="checkbox" name="class" value="Intermediate 2 Autumn"> Intermediate 2 - Wednesday 21:00</label>
            </div>
            <div id="classError" class="field-error">Please select at least one class</div>
        </div>
        
        <div class="form-group">
            <label for="role">Dancing role * (If you want to dance different roles in different classes, please sign up separately for both.)</label>
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
        <a href="/#schedule">← Back to schedule</a>
    </div>
</div>