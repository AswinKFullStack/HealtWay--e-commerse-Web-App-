

document.addEventListener('DOMContentLoaded', function() {

    const imageFields = ['productImage1', 'productImage2', 'productImage3'];
    
    // Setup cropper for each image field
    imageFields.forEach((fieldId, index) => {
        const imageInput = document.getElementById(fieldId);
        const cropBtn = document.getElementById(`cropBtn${index + 1}`);
        const imagePreview = document.getElementById(`imagePreview${index + 1}`);
        let cropper ;

        // Handle file selection and preview
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                if(imagePreview.firstChild){
                handleRemoveImageButtonClick( index + 1 );
                cropBtn.style.display = 'block';
                }
        
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.src = e.target.result;
                    img.style.maxWidth = '200px';
                    imagePreview.innerHTML = ''; 
                    imagePreview.appendChild(img);

                    // Initialize cropper
                    cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
                    if (cropper) {
                        cropper.destroy();
                    }
                   cropper = new Cropper(img, {  
                    aspectRatio: 1,
                    viewMode: 1,
                    autoCropArea: 0.8,});
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


//remove the existing images


function handleRemoveImageButtonClick(index) {
    const existingImage = document.getElementById(`existingImagePreview${index}`);
    const imagePreview = document.getElementById(`imagePreview${index}`);
    if (existingImage) {
        const removeBtn = document.getElementById(`removeBtn${index}`);
        const imageName =  removeBtn.getAttribute('data-image');

        existingImage.remove();
        removeBtn.remove();
        
            // Mark the image for deletion on the server-side
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'imagesToDelete[]';
        hiddenInput.value = imageName;
        document.getElementById('editProductForm').appendChild(hiddenInput);
      }
    


}



document.getElementById('editProductForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent form submission until validation is done

    if (validateForm()) {
        this.submit();
    }
});

function validateForm() {
    let isValid = true;

    // Validate product name
    const productName = document.getElementById('productName');
    if (productName.value.trim() === '') {
        setError(productName, 'Please provide a valid product name.');
        isValid = false;
    } else {
        clearError(productName);
    }

    // Validate category
    const productCategory = document.getElementById('productCategory');
    if (productCategory.value.trim() === '') {
        setError(productCategory, 'Please select a valid category.');
        isValid = false;
    } else {
        clearError(productCategory);
    }

    // Validate brand
    const productBrand = document.getElementById('productBrand');
    if (productBrand.value.trim() === '') {
        setError(productBrand, 'Please select a valid brand.');
        isValid = false;
    } else {
        clearError(productBrand);
    }

    // Validate regular price
    const regularPrice = document.getElementById('regularPrice');
    if (regularPrice.value.trim() === '' || isNaN(regularPrice.value) || Number(regularPrice.value) <= 0) {
        setError(regularPrice, 'Please provide a valid regular price.');
        isValid = false;
    } else {
        clearError(regularPrice);
    }

    // Validate sale price
    const salePrice = document.getElementById('salePrice');
    if (salePrice.value.trim() === '' || isNaN(salePrice.value) || Number(salePrice.value) < 0) {
        setError(salePrice, 'Please provide a valid sale price.');
        isValid = false;
    } else {
        clearError(salePrice);
    }

    if (Number(regularPrice.value) <= Number(salePrice.value)) {
        setError(salePrice, 'Sale price must be less than the regular price.');
        setError(regularPrice, 'Regular price must be greater than the sale price.');
        isValid = false;
    } else {
        clearError(regularPrice);
        clearError(salePrice);
    }

    // Validate quantity
    const quantity = document.getElementById('productQuantity');
    if (quantity.value.trim() === '' || isNaN(quantity.value) || Number(quantity.value) <= 0) {
        setError(quantity, 'Please provide a valid quantity.');
        isValid = false;
    } else {
        clearError(quantity);
    }

    // Validate description
    const description = document.getElementById('productDescription');
    if (description.value.trim() === '') {
        setError(description, 'Please provide a valid description.');
        isValid = false;
    } else {
        clearError(description);
    }

    // Validate image inputs based on existing image previews
    const productImages = document.querySelectorAll('input[type="file"]');
    productImages.forEach((input, index) => {
        const previewContainer = document.getElementById(`imagePreview${index + 1}`);
        const existingImage = previewContainer.querySelector('img'); // Check if an image exists in preview

        if (!existingImage && input.files.length === 0) {
            setImageError(input, `Please upload a valid image for Product Image ${index + 1}.`);
            isValid = false;
        } else {
            clearError(input);
        }
    });

    return isValid;
}

function setError(element, message) {
    const invalidFeedback = element.nextElementSibling;
    invalidFeedback.innerText = message;
    element.classList.add('is-invalid');
    element.style.borderColor = '#dc3545'; 
}

function setImageError(element, message) {
    setError(element, message);
    element.nextElementSibling.style.color = '#dc3545'; 
}

function clearError(element) {
    const invalidFeedback = element.nextElementSibling;
    invalidFeedback.innerText = '';
    element.classList.remove('is-invalid');
    element.style.borderColor = '';
}




