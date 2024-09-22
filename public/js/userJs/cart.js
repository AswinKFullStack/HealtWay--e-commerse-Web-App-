function updateQuantity(productId, change) {
    const quantityInput = document.getElementById(productId);
    let quantity = parseInt(quantityInput.value);

    quantity += change;
    if (quantity < 1) quantity = 1;

    quantityInput.value = quantity;

    updateTotalPrice();
}

function updateTotalPrice() {
    const product1Quantity = parseInt(document.getElementById('product1').value);
    const product2Quantity = parseInt(document.getElementById('product2').value);
    const product3Quantity = parseInt(document.getElementById('product3').value);

    const subtotal = (25 * product1Quantity) + (45 * product2Quantity) + (60 * product3Quantity);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;

    document.getElementById('totalPrice').innerText = `$${total.toFixed(2)}`;
}
