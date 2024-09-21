document.querySelectorAll('.delete-btn').forEach(function(button) {
    button.addEventListener('click', function(event) {
      const form = this.closest('.delete-form');  // Get the parent 
       // Show SweetAlert confirmation
       Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          form.submit();  // Proceed with form submission if confirmed
        }
      });
    });
  });