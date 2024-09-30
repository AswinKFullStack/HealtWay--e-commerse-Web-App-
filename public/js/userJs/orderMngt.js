function confirmRemove(orderId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to undo this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Cancel it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Perform AJAX request to remove item
            fetch(`/cancelOrder/${orderId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(response => response.json())
              .then(data => {
                  if (data.success) {
                      Swal.fire(
                          'Order Cancelled',
                          data.message,
                          'success'
                      ).then(() => {
                          // Reload the page to reflect the updated cart
                          location.reload();
                      });
                  } else {
                      Swal.fire('Error', data.message  || 'There was an issue Cancelling the Order.', 'error');
                  }
                }).catch(error => {
                  
                  Swal.fire('Error', 'There was a problem connecting to the server.', 'error');
              });
              
        }
    });
}
