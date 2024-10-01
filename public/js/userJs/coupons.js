
// Event listener for claim buttons
document.querySelectorAll('.claim-coupon').forEach(button => {
    button.addEventListener('click', function() {
        const couponCode = this.getAttribute('data-code');
        
        // Display SweetAlert with the coupon code
        Swal.fire({
            title: 'Your Coupon Code',
            html: `<p><strong>${couponCode}</strong></p>
                   <button class="btn btn-primary" id="copyCoupon" data-clipboard-text="${couponCode}">Copy Coupon</button>`,
            showCloseButton: true,
            showConfirmButton: false,
        });

        // Clipboard functionality for copying the coupon code
        new ClipboardJS('#copyCoupon').on('success', function(e) {
            // Display a success message after copying
            Swal.fire({
                icon: 'success',
                title: 'Copied!',
                text: 'Coupon code has been copied to your clipboard.',
                timer: 2000,
                showConfirmButton: false
            });
            e.clearSelection();
        });
    });
});

