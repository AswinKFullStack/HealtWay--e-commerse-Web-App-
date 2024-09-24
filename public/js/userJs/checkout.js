// Function to show Add/Edit Address form
function addNewAddress() {
    document.getElementById('savedAddresses').classList.add('d-none');
    document.getElementById('addressForm').classList.remove('d-none');
    document.getElementById('addressFormTitle').innerText = "Add New Address";
}

function editAddress() {
    document.getElementById('savedAddresses').classList.add('d-none');
    document.getElementById('addressForm').classList.remove('d-none');
    document.getElementById('addressFormTitle').innerText = "Edit Address";
}

// Function to validate form inputs
function validateCheckoutForm() {
    let valid = true;

    // Get form input fields
    const address = document.getElementById('inputAddress');
    const city = document.getElementById('inputCity');
    const state = document.getElementById('inputState');
    const zip = document.getElementById('inputZip');
    const country = document.getElementById('inputCountry');

    // Validate address
    if (address.value === "") {
        address.classList.add('is-invalid');
        valid = false;
    } else {
        address.classList.remove('is-invalid');
    }

    // Validate city
    if (city.value === "") {
        city.classList.add('is-invalid');
        valid = false;
    } else {
        city.classList.remove('is-invalid');
    }

    // Validate state
    if (state.value === "Choose...") {
        state.classList.add('is-invalid');
        valid = false;
    } else {
        state.classList.remove('is-invalid');
    }

    // Validate zip
    if (zip.value === "") {
        zip.classList.add('is-invalid');
        valid = false;
    } else {
        zip.classList.remove('is-invalid');
    }

    // Validate country
    if (country.value === "") {
        country.classList.add('is-invalid');
        valid = false;
    } else {
        country.classList.remove('is-invalid');
    }

    return valid;
}

// Function to save address and return to saved addresses section
function saveAddress() {
    if (validateCheckoutForm()) {
        alert("Address saved successfully!");
        document.getElementById('savedAddresses').classList.remove('d-none');
        document.getElementById('addressForm').classList.add('d-none');
    }
}
