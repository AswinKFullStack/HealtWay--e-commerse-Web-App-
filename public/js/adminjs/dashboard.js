// dashboard.js

$(document).ready(function () {
    // Initialize Circle Progress Bars
    initializeCircleProgress();

    // Sample Product Data
    const products = [
        {
            image: 'images/RagiP.jpg',
            name: 'Kashmeeri Mulak Podi',
            price: 250,
            quantitySold: 120,
            stockStatus: 'In Stock'
        },
        {
            image: 'images/WheatP.jpg',
            name: 'Malli Podi',
            price: 180,
            quantitySold: 90,
            stockStatus: 'Out of Stock'
        },
        {
            image: 'images/payarpodi_page-0001.jpg',
            name: 'Manjal',
            price: 200,
            quantitySold: 150,
            stockStatus: 'In Stock'
        },
        // Add more products as needed
    ];

    // Render Product Table
    renderProductTable(products);

    // Filter Button Click Event
    $('#filterButton').click(function () {
        // Implement filter logic here
        alert('Filter applied!');
    });

    // Report Button Click Event
    $('#reportButton').click(function () {
        // Implement report generation logic here
        alert('Redirecting to detailed report...');
    });
});

// Function to initialize circle progress bars
function initializeCircleProgress() {
    $('.circle-progress').each(function () {
        const percentage = $(this).data('percentage');
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 80;
        $(this).append(canvas);
        const context = canvas.getContext('2d');

        // Draw background circle
        context.beginPath();
        context.arc(40, 40, 35, 0, 2 * Math.PI);
        context.strokeStyle = '#e6e6e6';
        context.lineWidth = 10;
        context.stroke();

        // Draw progress circle
        context.beginPath();
        context.arc(40, 40, 35, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * (percentage / 100)), false);
        context.strokeStyle = '#ffc107';
        context.lineWidth = 10;
        context.stroke();
    });
}

// Function to render product table
function renderProductTable(products) {
    const tbody = $('#productTable tbody');
    tbody.empty();
    products.forEach(product => {
        const stockBadge = product.stockStatus === 'In Stock' ? 
            `<span class="badge badge-instock">In Stock</span>` : 
            `<span class="badge badge-outofstock">Out of Stock</span>`;

        const row = `
            <tr>
                <td><img src="${product.image}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>₹${product.price}</td>
                <td>${product.quantitySold}</td>
                <td>${stockBadge}</td>
            </tr>
        `;
        tbody.append(row);
    });

    // Implement pagination if needed
}
