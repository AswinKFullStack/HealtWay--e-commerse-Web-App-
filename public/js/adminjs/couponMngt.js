$(document).ready(function() {
    $('.btn-delete').on('click', function() {
        const couponId = $(this).closest('tr').data('coupon-id');

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `/admin/deleteCoupon/${couponId}`, // Replace with your server-side delete URL
                    type: 'GET',
                    success: function(response) {
                        Swal.fire(
                            'Deleted!',
                            'Your coupon has been deleted.',
                            'success'
                        ).then(() => {
                            // Option 1: Reload the current page
                            location.reload(); // This will reload the current page
                            
                            // Option 2: Redirect to the same page (you can customize the URL if needed)
                            // window.location.href = window.location.href; // This will also refresh the page
                        });
                    },
                    error: function(xhr, status, error) {
                        Swal.fire(
                            'Error!',
                            'An error occurred while deleting the coupon.'+error,
                            'error'
                        );
                    }
                });
            }
        });
    });
});