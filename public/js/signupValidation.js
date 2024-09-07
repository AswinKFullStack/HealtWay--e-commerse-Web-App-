document.getElementById('signupBtn').addEventListener('click', function(event) {
    event.preventDefault();

    // Get form elements
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm-password');

    // Clear any previous error messages
    clearErrors();

    // Validate form
    let isValid = true;

    // Name Validation
    if (!name.value.trim()) {
        showError('nameError', 'Full Name is required');
        isValid = false;
    }else if(!validateName(name.value)){
        showError('nameError', 'Please enter a valid name');
        isValid = false;
    }

    // Email Validation
    if (!email.value.trim()) {
        showError('emailError', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email.value)) {
        showError('emailError', 'Please enter a valid email');
        isValid = false;
    }

    // Phone Number Validation
    if (!phone.value.trim()) {
        showError('phoneError', 'Phone Number is required');
        isValid = false;
    } else if (!validatePhone(phone.value)) {
        showError('phoneError', 'Phone Number must be at least 10 digits');
        isValid = false;
    }

    // Password Validation
    if (!password.value.trim()) {
        showError('passwordError', 'Password is required');
        isValid = false;
    } else if (!validatePassword(password.value)) {
        showError('passwordError', 'Password must be at least 8 characters long, include both uppercase and lowercase letters, at least one digit, and one special character (e.g., @, $, !, %, *, ?, &).');
        isValid = false;
    }

    // Confirm Password Validation
    if (!confirmPassword.value.trim()) {
        showError('confirmPasswordError', 'Confirm Password is required');
        isValid = false;
    } else if (password.value !== confirmPassword.value) {
        showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
    }

    // Show form error if needed
    if (!isValid) {
        document.getElementById('formError').textContent = 'Please correct the errors above.';
    } else {
        // Submit the form if valid
        document.getElementById('signupForm').submit();
    }
});

// Function to show error message
function showError(id, message) {
    const errorElement = document.getElementById(id);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Function to clear errors
function clearErrors() {
    const errors = document.querySelectorAll('.error');
    errors.forEach(error => {
        error.style.display = 'none';
    });
}
//Name validation funtion 
function validateName(name){
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
}

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Phone number validation function
function validatePhone(phone) {
    const phoneRegex = /^\d{10,10}$/; // Ensure at least 10 digits
    return phoneRegex.test(phone);
}
//Password validation funtion 
function validatePassword(password){
    const passwordRegex =/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Function for "Sign Up with Google"
function signupWithGoogle() {
    alert('Google signup functionality is not yet implemented.');
}
