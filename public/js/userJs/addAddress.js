// /public/js/userJs/addAddress.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('addAddressForm');

    form.addEventListener('submit', function (event) {
        // Check if the form is valid
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Custom validation for pincode
        const pincode = document.getElementById('pincode');
        if (pincode.value.length !== 6) {
            pincode.classList.add('is-invalid');
            event.preventDefault();
            event.stopPropagation();
        } else {
            pincode.classList.remove('is-invalid');
            pincode.classList.add('is-valid');
        }

        // Custom validation for phone
        const phone = document.getElementById('phone');
        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone.value)) {
            phone.classList.add('is-invalid');
            event.preventDefault();
            event.stopPropagation();
        } else {
            phone.classList.remove('is-invalid');
            phone.classList.add('is-valid');
        }

        // Custom validation for alternate phone (if provided)
        const altPhone = document.getElementById('altPhone');
        if (altPhone.value) {
            if (!phonePattern.test(altPhone.value)) {
                altPhone.classList.add('is-invalid');
                event.preventDefault();
                event.stopPropagation();
            } else {
                altPhone.classList.remove('is-invalid');
                altPhone.classList.add('is-valid');
            }
        }

        form.classList.add('was-validated');
    }, false);
});
