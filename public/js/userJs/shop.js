



    document.getElementById('sortOptions').addEventListener('change', function () {
        const sortOption = this.value;
        const searchTerm = '<%= searchTerm %>';
        const page = '<%= productCurrentPage %>';
        window.location.href = `/shop?page=${page}&sort=${sortOption}&search=${searchTerm}`;
    });
