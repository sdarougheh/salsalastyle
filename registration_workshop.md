---
layout: resume
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
            <label>Which classes? (select all that apply) *</label>
            <div class="checkbox-list">


  {% for workshop in site.data.workshops %}
                <label><input type="checkbox" name="class" value="{{ workshop.title}}"> {{ workshop.title}} ({{ workshop.date}})</label>
  {% endfor %}

            </div>
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
        <a href="index.html">← Back to schedule</a>
    </div>
</div>