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
                alert('Order status updated successfully.');
            } else {
                alert('Error updating status.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
});
