// JavaScript for Category Page

let timeout;
document.getElementById('searchCategory').addEventListener('input', function(event) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const searchTerm = event.target.value.toLowerCase();
        window.location.href = `/admin/categories?search=${encodeURIComponent(searchTerm)}`;
    }, 500); // Adds a 500ms debounce
});
