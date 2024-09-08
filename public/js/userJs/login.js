document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    // Reset errors
    email.classList.remove('is-invalid');
    password.classList.remove('is-invalid');
    emailError.innerHTML = '';
    passwordError.innerHTML = '';

    let isValid = true;

    // Email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email.value.trim() === '') {
        emailError.innerHTML = 'Email is required';
        email.classList.add('is-invalid');
        isValid = false;
    } else if (!emailPattern.test(email.value)) {
        emailError.innerHTML = 'Please enter a valid email address';
        email.classList.add('is-invalid');
        isValid = false;
    }

    // Password validation
    if (password.value.trim() === '') {
        passwordError.innerHTML = 'Password is required';
        password.classList.add('is-invalid');
        isValid = false;
    }

    if (isValid) {
        // Perform form submission (e.g., send data to the server)
        document.getElementById('loginForm').submit();
    }
});
