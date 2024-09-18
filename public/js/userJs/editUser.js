// JavaScript for Form Validation

document.getElementById('editProfileForm').addEventListener('submit', function(event) {
    let isValid = true;
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    
    
    clearValidationErrors();

    if (name.value.trim() === '') {
        showValidationError(name, 'Your name is required.');
        isValid = false;
    }
    
    if (!validateEmail(email.value.trim())) {
        showValidationError(email, 'Please enter a valid email address.');
        isValid = false;
    }
    if (phone.value.trim() === '' || !validatePhone(phone.value.trim())) {
        showValidationError(phone, 'Phone number is required and must be valid.');
        isValid = false;
    }
   

    if (!isValid) {
        event.preventDefault(); 
    }
});



function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}


function validatePhone(phone) {
    return /^\d{10}$/.test(phone); 
}

function showValidationError(input, message) {
    input.classList.add('is-invalid');
    const feedback = input.nextElementSibling;
    feedback.textContent = message;
}

function clearValidationErrors() {
    document.querySelectorAll('.form-control').forEach(input => input.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(feedback => feedback.textContent = '');
}