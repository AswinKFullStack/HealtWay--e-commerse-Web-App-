



document.getElementById('sortOptions').addEventListener('change', function () {
    const sortOption = this.value;
    const searchTerm = new URLSearchParams(window.location.search).get('search') || '';
    window.location.href = `/shop?page=1&sort=${sortOption}&search=${searchTerm}`;
});
