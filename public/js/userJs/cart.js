
let typingTimer;
const doneTypingInterval = 1000; // 1 second

document.querySelectorAll('.quantity-input').forEach(input => {
  const cartItemId = input.id.split('-')[1]; // Extract cartItemId from input's ID
  input.addEventListener('input', function() {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      document.getElementById(`cart-form-${cartItemId}`).submit();
    }, doneTypingInterval);
  });
});

  
/// Script to hide message after 10 seconds -->

    // Check if the message element exists
    const cartMessage = document.getElementById('cart-message');
    if (cartMessage) {
        // Set a timeout to hide the message after 10 seconds (10000 milliseconds)
        setTimeout(() => {
            cartMessage.style.display = 'none';
        }, 1000);
    }


    function confirmRemove(productId, cartItemId) {
        if (confirm('Are you sure you want to remove this item from your cart?')) {
            document.querySelector(`form[action='/cart/remove/${productId}/${cartItemId}']`).submit();
        }
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
                fetch(`/cart/remove/${productId}/${cartItemId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => response.json())
                  .then(data => {
                      if (data.success) {
                          Swal.fire(
                              'Removed!',
                              'Your item has been removed from the cart.',
                              'success'
                          ).then(() => {
                              // Reload the page to reflect the updated cart
                              location.reload();
                          });
                      } else {
                          Swal.fire('Error', 'There was an issue removing the item.', 'error');
                      }
                  }).catch(error => {
                      Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
                  });
            }
        });
    }

