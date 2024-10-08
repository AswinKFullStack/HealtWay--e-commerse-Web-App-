




// Sort change event listener
document.getElementById('sortOptions').addEventListener('change', function () {
    const sortOption = this.value;
    const searchTerm = new URLSearchParams(window.location.search).get('search') || '';
    window.location.href = `/shop?page=1&sort=${sortOption}&search=${searchTerm}`;
});

// Search form event listener
document.getElementById('shopSearchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const searchTerm = this.querySelector('input[name="search"]').value.trim();
    const sortOption = new URLSearchParams(window.location.search).get('sort') || '';
    window.location.href = `/shop?page=1&sort=${sortOption}&search=${searchTerm}`;
});
