// Countdown timer logic
let countdown = 90;
let countdownInterval = setInterval(() => {
    document.getElementById("countdown").innerText = "You can resend OTP in " + countdown + " seconds";
    countdown--;
    if (countdown < 0) {
        clearInterval(countdownInterval);
        document.getElementById("countdown").innerText = "";
        document.getElementById("resend-btn").style.display = "block";
    }
}, 1000);

// Resend OTP button hidden initially
document.getElementById("resend-btn").style.display = "none";

// OTP validation and form submission
document.getElementById("otp-form").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent the default form submission

    let otp = document.getElementById("otp-input").value;

    if (otp === "") {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'OTP field cannot be empty!',
        });
    } else {
        // Simulating AJAX for OTP verification
        $.ajax({
            url: '/verify-otp',  // This should match your backend API endpoint
            type: 'POST',
            data: { otp: otp },
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'OTP Verified!',
                        text: 'Your email has been verified successfully.',
                        showConfirmButton:false,
                        timer:1500

                    }).then(() => {
                        window.location.href = response.redirectUrl;  // Proceed to submit the form
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Invalid OTP',
                        text: 'The OTP entered is incorrect. Please try again.',
                    });
                }
            },
            error: function() {
                Swal.fire({
                    icon: 'error',
                    title: 'Server Error',
                    text: 'Something went wrong. Please try again later.',
                });
            }
        });
    }
});

// Resend OTP functionality
document.getElementById("resend-btn").addEventListener("click", function() {
    $.ajax({
        url: '/resend-otp',
        type: 'GET',
        success: function(response) {
            Swal.fire({
                icon: 'success',
                title: 'OTP Resent!',
                text: 'A new OTP has been sent to your email.',
            });

            // Reset countdown
            countdown = 90;
            countdownInterval = setInterval(() => {
                document.getElementById("countdown").innerText = "You can resend OTP in " + countdown + " seconds";
                countdown--;
                if (countdown < 0) {
                    clearInterval(countdownInterval);
                    document.getElementById("countdown").innerText = "";
                    document.getElementById("resend-btn").style.display = "block";
                }
            }, 1000);

            document.getElementById("resend-btn").style.display = "none";
        },
        error: function() {
            Swal.fire({
                icon: 'error',
                title: 'Server Error',
                text: 'Failed to resend OTP. Please try again later.',
            });
        }
    });
});
