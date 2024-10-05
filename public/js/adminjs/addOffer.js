function toggleOfferFields() {
    
    const offerType = document.getElementById('offerType').value;
    const productFields = document.getElementById('productOfferFields');
    const categoryFields = document.getElementById('categoryOfferFields');
    const discountType = document.getElementById('discountTypeDiv');
    
    // Hide all offer-specific fields initially
    productFields.style.display = 'none';
    categoryFields.style.display = 'none';
    discountType.style.display = 'block';
    // Show specific fields based on offer type selection
    if (offerType === 'Product') {
        productFields.style.display = 'block';
    } else if (offerType === 'Category') {
        categoryFields.style.display = 'block';
    }else if (offerType === 'Referral') {
        discountType.style.display = 'none';
        
    }
}



///////////


    document.getElementById('submitOfferBtn').addEventListener('click', function (event) {
        event.preventDefault();

        // Clear previous errors
        document.querySelectorAll('.invalid-feedback').forEach(el => el.style.display = 'none');
        let isValid = true;

        // Offer Type Validation
        const offerType = document.getElementById('offerType');
        if (!offerType.value) {
            offerType.nextElementSibling.textContent = 'Please select a valid offer type.';
            offerType.nextElementSibling.style.display = 'block';
            isValid = false;
        }
        const discountType = document.getElementById('discountType');
       if(offerType.value === "Referral"){
        
        discountType.value = 'amount'
       }
       

        // Offer Title Validation
        const offerTitle = document.getElementById('offerTitle');
        if (!offerTitle.value.trim()) {
            offerTitle.nextElementSibling.textContent = 'Please provide a valid offer title.';
            offerTitle.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        
        if (!discountType.value) {
            discountType.nextElementSibling.textContent = 'Please select a discount type.';
            discountType.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        // Discount Value Validation
        const discountValue = document.getElementById('discountValue');
        if (!discountValue.value || isNaN(discountValue.value) || discountValue.value <= 0) {
            discountValue.nextElementSibling.textContent = 'Please enter a valid discount value.';
            discountValue.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        // Offer Image Validation
        const offerImage = document.getElementById('offerImage');
        const allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
        if (offerImage.files.length > 0 && !allowedExtensions.exec(offerImage.value)) {
            offerImage.nextElementSibling.textContent = 'Please upload a valid image file (jpg, jpeg, png, gif).';
            offerImage.nextElementSibling.style.display = 'block';
            isValid = false;
        }

        // If all fields are valid, send data via AJAX
        if (isValid) {
            const formData = new FormData(document.getElementById('addOfferForm'));
            fetch('/admin/offerAdd', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '/admin/offers';
                } else {
                    alert(data.message);
                }
            })
            .catch(err => alert('An error occurred: ' + err.message));
        }
    });

