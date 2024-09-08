// JavaScript for blocking/unblocking users

// Function to toggle between Block and Unblock
document.querySelectorAll('.block-btn, .unblock-btn').forEach(button => {
    button.addEventListener('click', function() {
        const row = this.closest('tr');
        const statusBadge = row.querySelector('.badge');

        if (statusBadge.classList.contains('badge-success')) {
            // If the user is active, block them
            statusBadge.classList.remove('badge-success');
            statusBadge.classList.add('badge-danger');
            statusBadge.textContent = 'Blocked';
            this.textContent = 'Unblock';
            this.classList.remove('btn-secondary');
            this.classList.add('btn-success');
            this.classList.remove('block-btn');
            this.classList.add('unblock-btn');
        } else {
            // If the user is blocked, unblock them
            statusBadge.classList.remove('badge-danger');
            statusBadge.classList.add('badge-success');
            statusBadge.textContent = 'Active';
            this.textContent = 'Block';
            this.classList.remove('btn-success');
            this.classList.add('btn-secondary');
            this.classList.remove('unblock-btn');
            this.classList.add('block-btn');
        }
    });
});
