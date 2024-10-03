document.querySelectorAll('.wishlist-btn').forEach(button => {
    button.addEventListener('click', function() {
        const productId = this.getAttribute('data-product-id');
        const heartIcon = this.querySelector('i');

        fetch(`/wishlist/toggle/${productId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response =>  response.json())
        .then(data => {
            if (data.success) {
                // Toggle heart icon state if the action was successful
                if (data.isInWishlist) {
                    heartIcon.classList.remove('bi-heart');
                    heartIcon.classList.add('bi-heart-fill');
                } else {
                    heartIcon.classList.remove('bi-heart-fill');
                    heartIcon.classList.add('bi-heart');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error.message);
            alert('An unexpected error occurred. Please log in.');
            window.location.href = "/login";
            } 
        );
    });
});

  