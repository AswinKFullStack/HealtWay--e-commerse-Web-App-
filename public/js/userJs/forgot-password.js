document.getElementById("forgotPasswordForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    const email = document.getElementById("email").value;
    const emailError = document.getElementById("emailError");


    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    
    emailError.textContent = "";

    if (emailPattern.test(email)) {
        return document.getElementById('forgotPasswordForm').submit();
              
    }else {
        return emailError.textContent = "Please enter a valid email address.";
        
    }

  
});