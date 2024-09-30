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
        }, 10000); // Show for 5 seconds before starting to fade out
    }





    
    

    document.getElementById('checkoutForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from submitting immediately
        
        // Show SweetAlert confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: "Do you want to place this order?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, place order!'
        }).then((result) => {
            if (result.isConfirmed) {
                let isValid = true;
    
                // Address Validation
                const selectedAddressElement = document.querySelector('input[name="address"]:checked');
                const addressError = document.getElementById('addressError');
                if (!selectedAddressElement) {
                    addressError.textContent = 'Please select a shipping address.';
                    isValid = false;
                } else {
                    addressError.textContent = ''; // Clear error if valid
                }
    
                // Quantity Validation
                const quantities = document.querySelectorAll('input[name="quantity"]');
                quantities.forEach(function(quantityField) {
                    const quantityError = document.getElementById('quantityError-' + quantityField.id.split('-')[1]);
                    if (quantityField.value < 1) {
                        quantityError.textContent = 'Quantity must be at least 1.';
                        isValid = false;
                    } else {
                        quantityError.textContent = ''; // Clear error if valid
                    }
                });
    
                // Payment Method Validation
                const selectedPaymentMethodElement = document.querySelector('input[name="paymentMethod"]:checked');
                const paymentError = document.getElementById('paymentError');
                if (!selectedPaymentMethodElement) {
                    paymentError.textContent = 'Please select a payment method.';
                    isValid = false;
                } else {
                    paymentError.textContent = ''; // Clear error if valid
                }
    
                // If all validations pass, submit the form using AJAX
                if (isValid) {
                    // Collect form data
                    const cartId = document.getElementById('cartId').value;
                    const selectedAddressId = selectedAddressElement.value;
                    const selectedPaymentMethod = selectedPaymentMethodElement.value;
    
                    console.log("Address ID =", selectedAddressId, "Payment Method =", selectedPaymentMethod);
    
                    // Submit form via AJAX
                    fetch(`/checkout/${cartId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json', // Set the content type to JSON
                            'Accept': 'application/json',
                        },
                        body: JSON.stringify({
                            addressId: selectedAddressId,
                            paymentMethod: selectedPaymentMethod
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.CODsuccess) {
                            Swal.fire(
                                'Order Placed!',
                                'Your order has been successfully placed.',
                                'success'
                            ).then(() => {
                                window.location.href = `/orderconfirm/${data.groupId}?totalPrice=${data.TotalPrice}`; // Redirect to confirmation page
                            });
                        } else if (data.OnlinePayment) {
                            Swal.fire({
                                title: 'Pay Online',
                                text: "For confirm your Order, please pay now",
                                icon: 'warning',
                                
                                confirmButtonColor: '#3085d6',
                                
                                confirmButtonText: 'Pay Now'
                            }).then(() => {
                                var options = {
                                    "key": data.razor_key_id,
                                    "amount": data.amount * 100, // in paise
                                    "currency": "INR",
                                    "order_id": data.razorpayOrderId, // Razorpay order ID
                                    
                                    "handler": function (response) {
                                        Swal.fire(
                                            'Order Placed!',
                                            'Your order has been successfully placed.',
                                            'success'
                                        ).then(() => {
                                            window.location.href = `/payment/success?cartId=${data.cartId}&paymentOrderId=${data.razorpayOrderId}&paymentId=` + response.razorpay_payment_id;
                                        });
                                    },
                                    "prefill": {
                                        "name": "Test User",
                                        "email": "testuser@gmail.com",
                                        "contact": "1234567890"
                                    }
                                };
                                var rzp1 = new Razorpay(options);
                                rzp1.on('payment.failed', function (response) {
                                    // Payment failed event listener
                                    handlePaymentFailure(data.cartId, data.razorpayOrderId, "Payment Failed", response.error);
                                });

                                // Listen to Razorpay modal closed event
                                rzp1.on('modal.closed', function () {
        // User closed the payment modal without completing the payment
                                handlePaymentFailure(data.cartId, data.razorpayOrderId, "Payment Cancelled");
                                });
                                rzp1.open();
                            });
                        } else {
                            Swal.fire(
                                'Error!',
                                'There was an issue placing your order. Please try again.',
                                'error'
                            );
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        Swal.fire(
                            'Error!',
                            'Something went wrong with your request.',
                            'error'
                        );
                    });
                }else{
                    Swal.fire(
                        'Error!',
                        'You need to fill all field. Please try again.',
                        'error'
                    );
                }
            }
        });
    });
    
    
// Custom function to handle payment failure


  // Custom function to handle payment failure or cancellation
function handlePaymentFailure(cartId, razorpayOrderId, reason, error = {}) {
    console.log(`${reason}:`, error);

    Swal.fire({
        title: `${reason}!`,
        text: `Unfortunately, your payment could not be completed. ${reason === 'Payment Cancelled' ? 'You cancelled the payment process.' : 'Restoring your cart items...'}`,
        icon: 'error',
    }).then(() => {
        // Call backend API to restore quantities
        fetch(`/online-payment-failed/restore-cart-items/${cartId}?paymentOrderId=${razorpayOrderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                Swal.fire('Cart Restored', 'Your cart has been restored successfully.', 'success').then(() => {
                    window.location.href = `/cartView`;
                });
            } else {
                Swal.fire('Error!', 'Failed to restore cart items. Please contact support.', 'error');
            }
        })
        .catch((error) => {
            console.error('Error restoring cart items:', error);
            Swal.fire('Error!', 'Something went wrong while restoring your cart.', 'error');
        });
    });
}
