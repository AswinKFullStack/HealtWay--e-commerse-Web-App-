// Function to show Add/Edit Address form
function addNewAddress() {
    document.getElementById('UserSavedAddressCard').classList.add('d-none');
    document.getElementById('addAddressForm').classList.remove('d-none');
    document.getElementById('addOredit-Title').innerText = "Add New Address";
}




function editAddress(addressId,addressType,name, houseName, landMark, city, state, pincode, phone,currentPage,altPhone = '') {

    document.getElementById('addressType').value = addressType;
    document.getElementById('name').value = name;
    document.getElementById('houseName').value = houseName;
    document.getElementById('landMark').value = landMark;
    document.getElementById('city').value = city; 
    document.getElementById('state').value = state;
    document.getElementById('pincode').value = pincode;
    document.getElementById('phone').value = phone;

    


    // Check if altPhone exists and is not empty
    document.getElementById('altPhone').value = altPhone ? altPhone : '';

    document.getElementById('addAddressForm').action = `/checkout/editAddress/${addressId}?page=${currentPage}`

    document.getElementById('UserSavedAddressCard').classList.add('d-none');
    document.getElementById('addAddressForm').classList.remove('d-none');
    document.getElementById('addOredit-Title').innerText = "Edit Address";
    
    
}

function CancelAddNewAddress(){
    document.getElementById('UserSavedAddressCard').classList.remove('d-none');
    document.getElementById('addAddressForm').classList.add('d-none');
}

// Function to save address and return to saved addresses section
function saveAddress() {
    if (validateCheckoutForm()) {
        alert("Address saved successfully!");
        document.getElementById('savedAddresses').classList.remove('d-none');
        document.getElementById('addressForm').classList.add('d-none');
    }
}

function updateCartQuantity(productId, cartItemId) {
    alert('The function updateCartQuantity is triggered');
    const redirectPath = '/checkout';
    // Get the quantity element
    const quantityElement = document.getElementById(`quantity-${cartItemId}`);
    
    if (!quantityElement) {
        console.error(`Element with id 'quantity-${cartItemId}' not found.`);
        Swal.fire('Error', 'Could not find the quantity input field. Please try again.', 'error');
        return;
    }
    
    const quantity = quantityElement.value;
    console.log(quantity);
    
    const url = `/checkout/cart/update/${productId}/${cartItemId}`;
    
    // Perform AJAX request to update item quantity
    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quantity: quantity,
            redirectPath

        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload or update the relevant part of the page after quantity is updated.
            location.reload();
        } else {
            Swal.fire('Error', data.message || 'There was an issue updating the item quantity.', 'error');
        }
    })
    .catch(error => {
        console.log('Error updating quantity:', error);
        Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
    });
}


/// Script to hide message after some seconds -->

    // Check if the message element exists
    const checkoutMessage = document.getElementById('checkout-message');
    if (checkoutMessage) {
        // Set a timeout to apply the fade-out effect after 5 seconds
        setTimeout(() => {
            checkoutMessage.classList.add('fade-out');
    
            // Hide the element after the fade-out transition is complete
            setTimeout(() => {
                checkoutMessage.style.display = 'none';
            }, 1000); // Match this timeout with the duration in your CSS transition
        }, 3000); // Show for 5 seconds before starting to fade out
    }