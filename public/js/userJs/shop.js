document.addEventListener('DOMContentLoaded', () => {
    const productSearch = document.getElementById('productSearch');
    const sortOptions = document.getElementById('sortOptions');
    const productGrid = document.getElementById('productGrid');

    // Search functionality
    productSearch.addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        const products = document.querySelectorAll('#productGrid .col-md-4');

        products.forEach(product => {
            const productName = product.querySelector('.card-title').textContent.toLowerCase();
            if (productName.includes(searchValue)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    });

    // Sorting functionality
    sortOptions.addEventListener('change', function () {
        const sortValue = this.value;
        const products = Array.from(productGrid.children);

        products.sort((a, b) => {
            if (sortValue === 'price-low-high') {
                return a.dataset.price - b.dataset.price;
            } else if (sortValue === 'price-high-low') {
                return b.dataset.price - a.dataset.price;
            } else if (sortValue === 'ratings') {
                return b.dataset.ratings - a.dataset.ratings;
            } else if (sortValue === 'az') {
                return a.dataset.name.localeCompare(b.dataset.name);
            } else if (sortValue === 'za') {
                return b.dataset.name.localeCompare(a.dataset.name);
            }
            return 0;
        });

        products.forEach(product => productGrid.appendChild(product));
    });
});
