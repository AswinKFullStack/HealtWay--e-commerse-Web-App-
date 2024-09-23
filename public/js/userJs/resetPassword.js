
    document.getElementById("resetPasswordForm").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        // Clear previous errors
        document.getElementById("newPasswordError").textContent = "";
        document.getElementById("confirmPasswordError").textContent = "";

        // Get form values
        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Password validation
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        let isValid = true;

        if (!passwordPattern.test(newPassword)) {
            document.getElementById("newPasswordError").textContent = "Password must contain at least 8 characters, including an uppercase letter, a lowercase letter, and a number.";
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            document.getElementById("confirmPasswordError").textContent = "Passwords do not match.";
            isValid = false;
        }

        // If the form is valid, submit the data
        if (isValid) {
           
            return document.getElementById('resetPasswordForm').submit();
            
        }
    });
