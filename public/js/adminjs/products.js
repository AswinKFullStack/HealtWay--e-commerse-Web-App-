// public/js/adminJs/products.js

document.getElementById('searchProduct').addEventListener('input', function() {
    const searchTerm = this.value.trim();
    const url = new URL(window.location.href);
    if (searchTerm) {
        url.searchParams.set('search', searchTerm);
    } else {
        url.searchParams.delete('search');
    }
    url.searchParams.set('page', 1); // Reset to first page on new search
    window.location.href = url.toString();
});
