document.addEventListener('DOMContentLoaded', function() {
    var submitButton = document.getElementById('submitProductBtn');
    const imageFields = ['productImage1', 'productImage2', 'productImage3'];
    
    // Add validation for each image field
    submitButton.addEventListener('click', function(event) {
        var form = document.getElementById('addProductForm');
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Ensure each image field is populated
        var allImagesSelected = imageFields.every(function(fieldId) {
            var fileInput = document.getElementById(fieldId);
            return fileInput.files.length > 0;
        });

        if (!allImagesSelected) {
            event.preventDefault();
            event.stopPropagation();
        }

        form.classList.add('was-validated');
    });

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