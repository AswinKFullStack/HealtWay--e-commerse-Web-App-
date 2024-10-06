  
/// Script to hide message after some seconds -->

    // Check if the message element exists
    const cartMessage = document.getElementById('cart-message');
    if (cartMessage) {
        // Set a timeout to apply the fade-out effect after 5 seconds
        setTimeout(() => {
            cartMessage.classList.add('fade-out');
    
            // Hide the element after the fade-out transition is complete
            setTimeout(() => {
                cartMessage.style.display = 'none';
            }, 1000); // Match this timeout with the duration in your CSS transition
        }, 3000); // Show for 5 seconds before starting to fade out
    }
        
    function confirmRemove(productId, cartItemId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to undo this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // Perform AJAX request to remove item
                fetch(`/cartView/remove/${productId}/${cartItemId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          Swal.fire(
                              'Removed!',
                              data.message,
                              'success'
                          ).then(() => {
                              // Reload the page to reflect the updated cart
                              location.reload();
                          });
                      } else {
                          Swal.fire('Error', data.message  || 'There was an issue removing the item.', 'error');
                      }
                    }).catch(error => {
                      
                      Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
                  });
                  
            }
        });
    }





    // JavaScript for Quantity Update with AJAX
    function updateQuantity(cartItemId, action, productId) {
        const quantityInput = document.getElementById(`quantity-${cartItemId}`);
        let currentQuantity = parseInt(quantityInput.value);
       
        if (action === 'decrease' && currentQuantity > 1) {
            currentQuantity -= 1;
        } else if (action === 'increase') {
            currentQuantity += 1;
        }
    
        
    
        fetch(`/cart/update/${cartItemId}/${productId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: currentQuantity })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update total price and other relevant data in the DOM
                updateCartItemTotal(cartItemId, currentQuantity, data.itemTotalPrice, data.itemFinalPrice);
                updateOrderSummary( data.cartSummarySubtotal ,data.cartSummaryTotal);
            } else {
               
                Swal.fire('Error', data.message, 'error');
                
                
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire('Error', "Server error", 'error');
            

        });
    }




    function updateCartItemTotal(cartItemId, newQuantity, itemTotalPrice, itemFinalPrice) {
        // Update the item's total price and final price
        const itemTotalElement = document.querySelector(`#item-total-price-${cartItemId}`);
        const itemFinalElement = document.querySelector(`#item-final-price-${cartItemId}`);
        const itemCurrentQnty = document.getElementById(`quantity-${cartItemId}`);
        if (itemTotalElement && itemFinalElement) {
            itemTotalElement.textContent = `$${itemTotalPrice.toFixed(2)}`;
            itemFinalElement.textContent = `$${itemFinalPrice.toFixed(2)}`;
            itemCurrentQnty.value = newQuantity;
        }
    }
    
    function updateOrderSummary(subtotal,total) {
        const discount = subtotal-total;
        // Update the order summary values
        const subtotalElement = document.querySelector('#cart-subtotal');
        const discountElement = document.querySelector('#cart-discount');
        const totalElement = document.querySelector('#cart-total');
        
        if (subtotalElement && discountElement && totalElement) {
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
            discountElement.textContent = `$${discount.toFixed(2)}`;
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    

