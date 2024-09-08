

function searchCustomer() {
    const searchTerm = document.getElementById('searchCustomer').value;
    const sortValue = document.getElementById('sortCustomer').value;
    window.location.href = `/admin/users?search=${encodeURIComponent(searchTerm)}&sort=${encodeURIComponent(sortValue)}`;
}
function updateSort() {
const sortValue = document.getElementById('sortCustomer').value;
const searchTerm = document.getElementById('searchCustomer').value;
window.location.href = `/admin/users?search=${encodeURIComponent(searchTerm)}&sort=${encodeURIComponent(sortValue)}`;
}