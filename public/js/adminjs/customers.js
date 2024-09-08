// JavaScript for Customer List Page

document.getElementById('searchCustomer').addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const name = row.children[0].textContent.toLowerCase();
        if (name.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

document.getElementById('sortCustomer').addEventListener('change', function () {
    const sortBy = this.value;
    const rowsArray = Array.from(document.querySelectorAll('tbody tr'));

    rowsArray.sort((a, b) => {
        let aValue, bValue;

        switch (sortBy) {
            case 'newest':
                aValue = a.dataset.addedDate;
                bValue = b.dataset.addedDate;
                break;
            case 'oldest':
                aValue = a.dataset.addedDate;
                bValue = b.dataset.addedDate;
                break;
            case 'more-purchaser':
                aValue = parseInt(a.dataset.purchaseCount, 10);
                bValue = parseInt(b.dataset.purchaseCount, 10);
                break;
            case 'low-purchaser':
                aValue = parseInt(a.dataset.purchaseCount, 10);
                bValue = parseInt(b.dataset.purchaseCount, 10);
                break;
            case 'active':
                aValue = a.dataset.status;
                bValue = b.dataset.status;
                break;
            case 'blocked':
                aValue = a.dataset.status;
                bValue = b.dataset.status;
                break;
            default:
                aValue = a.dataset.addedDate;
                bValue = b.dataset.addedDate;
        }

        return aValue > bValue ? 1 : -1;
    });

    const tbody = document.querySelector('tbody');
    rowsArray.forEach(row => tbody.appendChild(row));
});

function blockUser(button) {
    const row = button.closest('tr');
    row.children[3].innerHTML = '<span class="badge badge-danger">Blocked</span>';
    button.innerHTML = 'Unblock';
    button.className = 'btn btn-sm btn-success';
    button.setAttribute('onclick', 'unblockUser(this)');
}

function unblockUser(button) {
    const row = button.closest('tr');
    row.children[3].innerHTML = '<span class="badge badge-success">Active</span>';
    button.innerHTML = 'Block';
    button.className = 'btn btn-sm btn-danger';
    button.setAttribute('onclick', 'blockUser(this)');
}
