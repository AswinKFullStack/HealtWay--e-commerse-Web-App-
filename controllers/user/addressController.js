const User = require("../../models/userSchema");
const Address = require('../../models/addressSchema');

const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

const getAddressesView = async (req,res) => {
    try {
        const { page = 1, limit = 3 } = req.query;
        const userId = req.params.userId;
        
        const addressDoc = await Address.findOne({ userId }).select('address');

        if (!addressDoc) {
            return res.render('Address-mngt', {
                title: 'Address management',
                activePage: 'address management',
                user: await User.findById(req.session.user),
                addresses: [],
                userId,
                currentPage: 1,
                totalPages: 1,
                message: "No addresses found."
            });
        }

        const totalAddresses = addressDoc.address.length;
        const totalPages = Math.ceil(totalAddresses / limit);
        const currentPage = parseInt(page, 10) > totalPages ? totalPages : parseInt(page, 10);

        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + parseInt(limit, 10);

        const paginatedAddresses = addressDoc.address.slice(startIndex, endIndex);

        const user =await User.findById(req.session.user);
        res.render('Address-mngt', {
            title: 'Address management',
            activePage :'address management',
            user,
            addresses: paginatedAddresses, 
            userId,
            currentPage, 
            totalPages,
            totalAddresses,
            limit});

    } catch (error) {
        console.error("Error fetching addresses(getAddressesView)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while Error fetching addresses", req.headers.referer || `/profileview/${req.params.userId}`);
    }
}


const getAddAddress = async (req,res) => {
    try {
        const user =await User.findById(req.session.user);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        res.render('addAddress', {
            title: "Add Address",
            activePage: 'addAddress',
            user,
            errors: [],
            formData: {}
        });
    } catch (error) {
        console.error("Error loading add address page(getAddAddress)", error);
        const backLink = req.headers.referer || `/profileview/${req.session.user}`;
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while loading the Add Address page.", backLink);
    }
}

const postAddAddress = async (req,res) => {
    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const {
            addressType,
            name,
            houseName,
            landMark,
            city,
            state,
            pincode,
            phone,
            altPhone
        } = req.body;

        if (!addressType || !name || !houseName || !landMark || !city || !state || !pincode || !phone) {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['All required fields must be filled.'],
                formData: req.body
            });
        }

        const pincodeNumber = Number(pincode);
        if (isNaN(pincodeNumber) || pincodeNumber < 100000 || pincodeNumber > 999999) {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Pincode must be a valid 6-digit number.'],
                formData: req.body
            });
        }

        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone)) {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Phone number must be a valid 10-digit number.'],
                formData: req.body
            });
        }

        if (altPhone && !phonePattern.test(altPhone)) {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Alternate phone number must be a valid 10-digit number.'],
                formData: req.body
            });
        }

        const newAddress = {
            addressType,
            name,
            houseName,
            landMark,
            city,
            state,
            pincode: pincodeNumber,
            phone,
            ...(altPhone && { altPhone })
        };

        let addressDoc = await Address.findOne({ userId: user._id });

        if (addressDoc) {
            addressDoc.address.push(newAddress);
        } else {
            addressDoc = new Address({
                userId: user._id,
                address: [newAddress]
            });
        }
        await addressDoc.save();
       
        res.redirect(`/addresses/${user._id}?message=Address added successfully`);

    } catch (error) {
        console.error("Error saving address (postAddAddress)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while saving the address.", req.headers.referer || `/addAddress`);
    }
}
module.exports={
    getAddressesView,
    getAddAddress,
    postAddAddress
}