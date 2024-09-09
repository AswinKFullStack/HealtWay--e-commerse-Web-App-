
// JavaScript for Add Category Page

document.getElementById('addCategoryForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // Get form data
    const categoryName = document.getElementById('categoryName').value.trim();
    const categoryDescription = document.getElementById('categoryDescription').value.trim();
   

    let isValid = true;

    // Check if the category name is empty
    if (categoryName === '') {
        alert('Please enter a category name');
        isValid = false;
    }

    // Check if the category description is empty
    if (categoryDescription === '') {
        alert('Please enter a category Description');
        isValid = false;
    }

   

    // If the form is valid, submit it
    if (isValid) {
        document.getElementById('addCategoryForm').submit();
    }
});


