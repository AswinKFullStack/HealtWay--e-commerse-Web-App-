var submitButton = document.getElementById('submitProductBtn');

// Listen to the submit button click event
submitButton.addEventListener('click', function(event) {
    var form = document.getElementById('addProductForm');
    
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
});

// Handle image selection and cropping logic
document.getElementById('productImage').addEventListener('change', function(event) {
    const files = event.target.files;
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    imagePreviewContainer.innerHTML = ''; // Clear previous previews

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    let invalidFiles = 0;

    Array.from(files).forEach(file => {
        if (!validTypes.includes(file.type)) {
            invalidFiles++;
        }
    });

    if (files.length < 3) {
        alert("Please upload at least three images.");
        return;
    }

    if (invalidFiles > 0) {
        alert("Only image files (jpg, png, gif) are allowed.");
        return;
    }

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.maxWidth = '200px';
            img.style.margin = '10px';
            img.classList.add('img-preview');

            const imgContainer = document.createElement('div');
            imgContainer.appendChild(img);

            // Add cropping functionality
            const cropBtn = document.createElement('button');
            cropBtn.innerText = 'Crop';
            cropBtn.classList.add('btn', 'btn-primary', 'btn-sm');
            imgContainer.appendChild(cropBtn);

            // Prevent the form from submitting when "Crop" button is clicked
            cropBtn.addEventListener('click', function(event) {
                event.preventDefault(); // Prevent form submission when cropping

                const existingSaveBtn = imgContainer.querySelector('.btn-success');
                if (existingSaveBtn) {
                    // Prevent adding multiple save buttons
                    return;
                }
                
                const cropper = new Cropper(img, {
                    aspectRatio: 1,
                    viewMode: 1,
                    crop(event) {
                        // Cropping logic
                    }
                });

                // Add a Save button to save the cropped image
                const saveBtn = document.createElement('button');
                saveBtn.innerText = 'Save Crop';
                saveBtn.classList.add('btn', 'btn-success', 'btn-sm');
                imgContainer.appendChild(saveBtn);

                // Prevent the form from submitting when "Save Crop" is clicked
                saveBtn.addEventListener('click', function(event) {
                    event.preventDefault(); // Prevent form submission when saving the cropped image

                    const croppedCanvas = cropper.getCroppedCanvas();
                    croppedCanvas.toBlob(blob => {
                        if (!blob) {
                            console.error('Canvas is empty');
                            return;
                        }
                        const croppedFile = new File([blob], `cropped_${file.name}`, { type: blob.type });
                        
                        // You can now use `croppedFile` to upload or display the cropped image.
                        console.log('Cropped image file:', croppedFile);
                        
                        // Optionally preview the cropped image
                        const croppedImgURL = URL.createObjectURL(croppedFile);
                        const previewImg = document.createElement('img');
                        previewImg.src = croppedImgURL;
                        previewImg.style.maxWidth = '200px';
                        imgContainer.appendChild(previewImg);
                    });
                });
            });

            imagePreviewContainer.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    });
});
