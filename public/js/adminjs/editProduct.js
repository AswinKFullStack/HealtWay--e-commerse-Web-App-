// Ensure the image error message is hidden by default
const imageErrorDiv = document.querySelector('#productImage + .invalid-feedback');
imageErrorDiv.style.display = 'none';

submitButton.addEventListener('click', function (event) {
    var form = document.getElementById('editProductForm');

    if (form.checkValidity() === false) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        // Ensure at least 3 images are selected
        const files = document.getElementById('productImage').files;
        const existingImages = document.querySelectorAll('input[name="existingImages[]"]').length;

        if (files.length + existingImages < 3) {
            event.preventDefault();
            event.stopPropagation();
            imageErrorDiv.innerText = 'Please ensure there are at least three images in total.';
            imageErrorDiv.style.display = 'block'; // Ensure it is visible
        } else {
            imageErrorDiv.style.display = 'none'; // Hide if validation passes
        }
    }

    form.classList.add('was-validated');
});


// Handle existing image removal
document.querySelectorAll('.remove-image-btn').forEach(button => {
    button.addEventListener('click', function() {
        const imageName = this.getAttribute('data-image');
        this.parentElement.remove(); // Remove the image preview element
        // Optionally, mark the image for deletion on the server-side
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'imagesToDelete[]';
        hiddenInput.value = imageName;
        document.getElementById('editProductForm').appendChild(hiddenInput);
    });
});

// Handle new image selection and cropping logic
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
                if (!window.FileReader || !window.Cropper) {
                    alert("Your browser does not support some features needed for this page. Please use a modern browser.");
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
                saveBtn.addEventListener('click', function (event) {
                    event.preventDefault(); // Prevent form submission when saving the cropped image
                
                    const croppedCanvas = cropper.getCroppedCanvas();
                    if (!croppedCanvas) {
                        alert('Error occurred while cropping the image. Please try again.');
                        return;
                    }
                    
                    croppedCanvas.toBlob(blob => {
                        if (!blob) {
                            console.error('Canvas is empty');
                            alert('Failed to create a cropped image. Please try again.');
                            return;
                        }
                
                        const croppedFile = new File([blob], `cropped_${file.name}`, { type: blob.type });
                        
                        // ... [rest of the code for handling cropped images]
                  
                
                        
                        // Remove any previously saved cropped image before adding the new one
                        const previousCroppedImg = imgContainer.querySelector('.cropped-preview');
                        if (previousCroppedImg) {
                            imgContainer.removeChild(previousCroppedImg);
                        }

                        // Create a new image element for the cropped version
                        const croppedImgURL = URL.createObjectURL(croppedFile);
                        const previewImg = document.createElement('img');
                        previewImg.src = croppedImgURL;
                        previewImg.style.maxWidth = '200px';
                        previewImg.classList.add('cropped-preview'); // Add a class to easily identify this element

                        // Append the new cropped image
                        imgContainer.appendChild(previewImg);
                    });
                });
            });

            imagePreviewContainer.appendChild(imgContainer);
        };
        reader.readAsDataURL(file);
    });
});
