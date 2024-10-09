document.addEventListener('DOMContentLoaded', function() {
    const imageFields = ['productImage1', 'productImage2', 'productImage3'];
    

    // Setup cropper for each image field
    imageFields.forEach((fieldId, index) => {
        const imageInput = document.getElementById(fieldId);
        const cropBtn = document.getElementById(`cropBtn${index + 1}`);
        const imagePreview = document.getElementById(`imagePreview${index + 1}`);
        let cropper;

        
        // Handle file selection and preview
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            
            if (file) {
                while (imagePreview.firstChild) {
                    imagePreview.removeChild(imagePreview.firstChild);
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    imagePreview.innerHTML = ''; // Clear previous preview
                    imagePreview.appendChild(img);

                    // Initialize cropper
                    cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
                    if (cropper) cropper.destroy();
                    cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
                };
                reader.readAsDataURL(file);
            }
        });

         // Crop and replace the input file with cropped version
         cropBtn.addEventListener('click', function(event) {
            event.preventDefault();
            if (cropper) {
                const croppedCanvas = cropper.getCroppedCanvas();
                croppedCanvas.toBlob(function(blob) {
                    const croppedFile = new File([blob], `cropped_${fieldId}.jpg`, { type: blob.type });
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(croppedFile);
                    imageInput.files = dataTransfer.files;

                    // Display the cropped image in the preview
                    const croppedImgURL = URL.createObjectURL(croppedFile);
                    imagePreview.innerHTML = `<img src="${croppedImgURL}" style="max-width: 200px;">`;
                });
            }
        });
    });
});





document.getElementById('addProductForm').addEventListener('submit', function(event) {
    event.preventDefault();
    let isValid = true;

    const inputs = document.querySelectorAll('.form-control, .custom-select');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
        input.nextElementSibling.textContent = '';
    });

    const productName = document.getElementById('productName');
    if (productName.value.trim() === '') {
        isValid = false;
        productName.classList.add('is-invalid');
        productName.nextElementSibling.textContent = 'Product name is required.';
        productName.nextElementSibling.style.color = 'red';
    }

    const productCategory = document.getElementById('productCategory');
    if (productCategory.value === '') {
        isValid = false;
        productCategory.classList.add('is-invalid');
        productCategory.nextElementSibling.textContent = 'Please select a valid category.';
        productCategory.nextElementSibling.style.color = 'red';
    }

    const productBrand = document.getElementById('productBrand');
    if (productBrand.value === '') {
        isValid = false;
        productBrand.classList.add('is-invalid');
        productBrand.nextElementSibling.textContent = 'Please select a valid brand.';
        productBrand.nextElementSibling.style.color = 'red';
    }

    const regularPrice = document.getElementById('regularPrice');
    const regularPriceValue = parseFloat(regularPrice.value);
    if (isNaN(regularPriceValue) || regularPriceValue <= 0) {
        isValid = false;
        regularPrice.classList.add('is-invalid');
        regularPrice.nextElementSibling.textContent = 'Please provide a valid regular price.';
        regularPrice.nextElementSibling.style.color = 'red';
    }

    const salePrice = document.getElementById('salePrice');
    const salePriceValue = parseFloat(salePrice.value);
    if (isNaN(salePriceValue) || salePriceValue <= 0) {
        isValid = false;
        salePrice.classList.add('is-invalid');
        salePrice.nextElementSibling.textContent = 'Please provide a valid sale price.';
        salePrice.nextElementSibling.style.color = 'red';
    }

    if (isValid && regularPriceValue < salePriceValue) {
        isValid = false;
        salePrice.classList.add('is-invalid');
        salePrice.nextElementSibling.textContent = 'Sale price must be less than the regular price.';
        salePrice.nextElementSibling.style.color = 'red';
    }

    const productQuantity = document.getElementById('productQuantity');
    if (isNaN(productQuantity.value) || parseInt(productQuantity.value) <= 0) {
        isValid = false;
        productQuantity.classList.add('is-invalid');
        productQuantity.nextElementSibling.textContent = 'Please provide a valid quantity.';
        productQuantity.nextElementSibling.style.color = 'red';
    }

    const productWeight = document.getElementById('productWeight');
    if (productWeight.value === '') {
        isValid = false;
        productWeight.classList.add('is-invalid');
        productWeight.nextElementSibling.textContent = 'Please select a valid weight.';
        productWeight.nextElementSibling.style.color = 'red';
    }

    const productDescription = document.getElementById('productDescription');
    if (productDescription.value.trim() === '') {
        isValid = false;
        productDescription.classList.add('is-invalid');
        productDescription.nextElementSibling.textContent = 'Description is required.';
        productDescription.nextElementSibling.style.color = 'red';
    }

    const productImage1 = document.getElementById('productImage1');
    const productImage2 = document.getElementById('productImage2');
    const productImage3 = document.getElementById('productImage3');
    if (!productImage1.files.length && !productImage2.files.length && !productImage3.files.length) {
        isValid = false;
        alert('Please select at least one product image.');
    }

    if (isValid) {
        this.submit();
    }
});

