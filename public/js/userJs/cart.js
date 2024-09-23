// Function to handle adding or subtracting quantity
function updateQuantity(action, cartItemId) {
    const quantityInput = document.getElementById(`quantity-${cartItemId}`);
    let currentQuantity = parseInt(quantityInput.value) || 1;
    
    if (action === 'add') {
      quantityInput.value = currentQuantity + 1;
    } else if (action === 'subtract' && currentQuantity > 1) {
      quantityInput.value = currentQuantity - 1;
    }
    
    // Submit the form for the correct cart item
    document.getElementById(`cart-form-${cartItemId}`).submit();
}

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

  
