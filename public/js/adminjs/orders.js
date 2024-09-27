// public/js/adminJs/products.js

document.getElementById('searchOrder').addEventListener('input', function() {
    const orderTerm = this.value.trim();
    const url = new URL(window.location.href);
    if (orderTerm) {
        url.searchParams.set('search', orderTerm);
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.set('page', 1); // Reset to first page on new search
    window.location.href = url.toString();
});





// orders.js
document.querySelectorAll('.order-status').forEach((element) => {
    element.addEventListener('change', function() {
        const orderId = this.getAttribute('data-order-id');
        const itemOrderId = this.getAttribute('data-item-orderId');
        const newStatus = this.value;

        fetch(`/admin/order/changeStatus/${orderId}/${itemOrderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Swal.fire(
                    'Order status updated successfully',
                    data.message,
                    'success'
                 ).then(() => {
                    // Reload the page to reflect the updated cart
                    location.reload();
                });
             } else {
                Swal.fire('Error', data.message  || 'There was an issue Error updating status of the Order.', 'error');
            }
        })
        .catch(error => {
            Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
        });
    });
});







function cancelOrder(orderId, itemOrderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        $.ajax({
            url: `/admin/order/cancel/${orderId}/${itemOrderId}`,
            type: 'POST',
            success: function(response) {
                if (response.success) {
                    alert(response.message);
                    location.reload(); // Refresh the page to reflect changes
                } else {
                    alert('Failed to cancel the order.');
                }
            },
            error: function() {
                alert('An error occurred while canceling the order.');
            }
        });
    }
}
