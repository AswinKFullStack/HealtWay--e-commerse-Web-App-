(function () {
    'use strict';
    window.addEventListener('load', function () {
        var forms = document.getElementsByClassName('needs-validation');
        var validation = Array.prototype.filter.call(forms, function (form) {
            form.addEventListener('submit', function (event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // Ensure at least 3 images are selected
                    const files = document.getElementById('productImage').files;
                    if (files.length < 3) {
                        event.preventDefault();
                        event.stopPropagation();
                        const imageErrorDiv = document.querySelector('#productImage + .invalid-feedback');
                        imageErrorDiv.innerText = 'Please upload at least three images.';
                        imageErrorDiv.style.display = 'block'; // Ensure it is visible
                    }
                }
                form.classList.add('was-validated');
            }, false);
        });
    }, false);
})()