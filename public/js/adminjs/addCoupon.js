$(document).ready(function() {
    // Function to validate the fields
    function validateField(input) {
        if ($(input).val().trim() === '') {
            $(input).addClass('is-invalid');
        } else {
            $(input).removeClass('is-invalid');
        }
    }

    // Event listener for real-time validation on each input field
    $('#couponCode, #minPurchaseAmount, #couponName, #discountType, #discountValue, #couponStatus, #endDate').on('input change', function() {
        validateField(this); // Validate each field on user input/change
    });

    $('#couponForm').on('submit', function(e) {
        e.preventDefault(); // Prevent the default form submission

        var isValid = true;

        // Clear previous invalid classes
        $('.form-control').removeClass('is-invalid');

        // Get form data
        var formData = {
            couponCode: $('#couponCode').val(),
            minPurchaseAmount: $('#minPurchaseAmount').val(),
            couponName: $('#couponName').val(),
            discountType: $('#discountType').val(),
            discountValue: $('#discountValue').val(),
            couponStatus: $('#couponStatus').val(),
            endDate: $('#endDate').val()
        };

        // Basic validation for each field
        if (!formData.couponCode) {
            $('#couponCode').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.minPurchaseAmount) {
            $('#minPurchaseAmount').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.couponName) {
            $('#couponName').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.discountType) {
            $('#discountType').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.discountValue) {
            $('#discountValue').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.couponStatus) {
            $('#couponStatus').addClass('is-invalid');
            isValid = false;
        }
        if (!formData.endDate) {
            $('#endDate').addClass('is-invalid');
            isValid = false;
        }

        // If the form is not valid, show error alert and stop further execution
        if (!isValid) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Please correct the highlighted fields.',
            });
            return;
        }

        // Proceed with AJAX request if the form is valid
        $.ajax({
            type: 'POST',
            url: '/admin/addCoupon',
            data: formData,
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Coupon Created',
                        text: response.message,
                    });
                    $('#couponForm')[0].reset(); // Reset the form upon success
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.message,
                    });
                }
            },
            error: function(err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'There was a problem submitting the form.',
                });
            }
        });
    });
});


