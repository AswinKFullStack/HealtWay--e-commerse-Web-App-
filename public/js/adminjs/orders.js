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
