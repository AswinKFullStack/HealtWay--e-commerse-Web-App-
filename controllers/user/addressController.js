const mongoose = require('mongoose');
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
        const message = req.query.message; // Check if message is passed in query
        const addressDoc = await Address.findOne({ userId }).select('address').lean();

        if (!addressDoc || addressDoc.address.length === 0) {
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

        
         // Sort the addresses in descending order based on createdAt (latest first)
         const sortedAddresses = addressDoc.address.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
            const dateB = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
            return dateB - dateA;
        });

        const totalAddresses = sortedAddresses.length;
        const totalPages = Math.ceil(totalAddresses / limit);
        const currentPage = parseInt(page, 10) > totalPages ? totalPages : parseInt(page, 10);

        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + parseInt(limit, 10);

        const paginatedAddresses = sortedAddresses.slice(startIndex, endIndex);
        
        
        

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
            limit,
        message});

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
            altPhone,
            redirectPath // Added to handle where to redirect after adding address
        } = req.body;

        if (!addressType || !name || !houseName || !landMark || !city || !state || !pincode || !phone) {
            
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent('All required fields must be filled.')}`);
            } else {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['All required fields must be filled.'],
                formData: req.body
            });
        }
        }

        const pincodeNumber = Number(pincode);
        if (isNaN(pincodeNumber) || pincodeNumber < 100000 || pincodeNumber > 999999) {

            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent('Pincode must be a valid 6-digit number.')}`);
            } else {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Pincode must be a valid 6-digit number.'],
                formData: req.body
            });
        }
        }

        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone)) {

            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent('phone number must be a valid 10-digit number.')}`);
            } else {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Phone number must be a valid 10-digit number.'],
                formData: req.body
            });
        }
        }

        if (altPhone && !phonePattern.test(altPhone)) {
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent('Alternate phone number must be a valid 10-digit number.')}`);
            } else {
            return res.status(400).render('addAddress', {
                title: "Add Address",
                activePage: 'addAddress',
                user,
                errors: ['Alternate phone number must be a valid 10-digit number.'],
                formData: req.body
            });
        }
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
        const message = "Address added successfully!";
        // Use redirectPath to determine where to go next
        if (redirectPath === '/checkout') {
            return res.redirect(`/checkout?message=${encodeURIComponent(message)}`);
        } else {
            return res.redirect(`/addresses/${user._id}?message=${encodeURIComponent(message)}`);
        }
    } catch (error) {
        console.error("Error saving address (postAddAddress)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while saving the address.", req.headers.referer || `/addAddress`);
    }
}



const getEditAddress = async (req,res) => {
    try {
        const { page = 1} = req.query;
        const currentPage = page;
        const user = await User.findById(req.session.user);
        const addressId = req.params.addressId;

        if (!user) {
            return res.status(404).send('User not found.');
        }

        console.log('Address ID:', addressId);

        // Validate  addressId 
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).render('editAddress', {
                title: 'Edit Address',
                activePage: 'address management',
                user,
                errors: ['Invalid Address ID'],
            });
        }
    
        const addressObjectId = new mongoose.Types.ObjectId(addressId);
        const userId = user._id;
        const aggregationResult = await Address.aggregate([
            { $match: { userId} },
            { $unwind: '$address' }, // Unwind the address array to filter on individual addresses
            { $match: { 'address._id': addressObjectId } },
            { $replaceRoot: { newRoot: '$address' } } // Replace the root with the address object
        ]);

        console.log('Aggregation Result:', aggregationResult);

        if (!aggregationResult || aggregationResult.length === 0) {
            return res.status(400).render('editAddress', {
                title: 'Edit Address',
                activePage: 'address management',
                user,
                errors: ['Address not found'],
            });
        }

        const address = aggregationResult[0]; // Extract the address object

        // Render the editAddress view with the found address
        res.render('editAddress', {
            title: 'Edit Address',
            activePage: 'address management',
            user,
            address,
            currentPage, // Pass the single address object
            errors: [],

        });

    }catch (error) {
    console.error('Error in getEditAddress:', error); // Enhanced error logging

    const backLink = req.headers.referer || `/addresses/${req.session.user}`;
    renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while loading the edit address page.", backLink);
    
    }
};

///  Edit address
const postEditAddress = async (req,res)=>{
    try {
        const { page = 1} = req.query;
        const currentPage = page;
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        const addressId = req.params.addressId;
        const {
            addressType,
            name,
            houseName,
            landMark,
            city,
            state,
            pincode,
            phone,
            altPhone,
            redirectPath
        } = req.body;

        if (!addressType || !name || !houseName || !landMark || !city || !state || !pincode || !phone) {
            

            const message = "All required fields must be filled.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(400).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}`);
            }
        }

        const pincodeNumber = Number(pincode);
        if (isNaN(pincodeNumber) || pincodeNumber < 100000 || pincodeNumber > 999999) {
           
            const message = "Pincode must be a valid 6-digit number.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(400).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}`);
            }
        }

        const phonePattern = /^\d{10}$/;
        if (!phonePattern.test(phone)) {
            const message = "Phone number must be a valid 10-digit number.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(400).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}`);
            }
        }

        if (altPhone && !phonePattern.test(altPhone)) {
            
            const message = "Alternate phone number must be a valid 10-digit number.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(400).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}`);
            }
        }

        const updatedAddress = {
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
       
         // Validate and convert addressId to ObjectId
         if (!mongoose.Types.ObjectId.isValid(addressId)) {
            const message = "Invalid Address ID.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(400).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }
        }

        const addressObjectId = new mongoose.Types.ObjectId(addressId);
        const userId = user._id; // user._id is already an ObjectId
        console.log(`Updating address for user ID: ${userId} and address ID: ${addressObjectId}`);
        // Perform the update
        
              

        const addressUpdateResult = await Address.updateOne(
            { userId, 'address._id': addressObjectId }, // Match the user and the specific address
            {
                $set: {
                    'address.$.addressType': addressType,
                    'address.$.name': name,
                    'address.$.houseName': houseName,
                    'address.$.landMark': landMark,
                    'address.$.city': city,
                    'address.$.state': state,
                    'address.$.pincode': pincodeNumber,
                    'address.$.phone': phone,
                    ...(altPhone && { 'address.$.altPhone': altPhone })
                }
            }
        );

        
        console.log('Update Result:', addressUpdateResult);


        // Check if any document was matched and modified
        if (addressUpdateResult.matchedCount === 0) {
            const message = "Address not found.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(404).redirect(`/editAddress/${addressId}?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }
        }

        if (addressUpdateResult.modifiedCount === 0) {
            const message = "No changes were made to the address.";
            if (redirectPath === '/checkout') {
                return res.redirect(`/checkout?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
            return res.status(200).redirect(`/addresses/${user._id}?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }
        }
        
        // Successful update
        const successMessage = "Address edited successfully!";
        if (redirectPath === '/checkout') {
            return res.redirect(`/checkout?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
        } else {
        res.redirect(`/addresses/${user._id}?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
        }

    } catch (error) {
        console.error("Error Editing address (postEditAddress)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while Editing the address.", req.headers.referer || `/addAddress`);
        
    }
}



////////DELETE ADDRESS
const deleteAddress = async (req,res) => {
    try {
        const { page = 1} = req.query;
        const currentPage = page;
        const user = await User.findById(req.session.user);
        if(!user){
            return res.status(404).send("User Not found");
        }
        const addressId = req.params.addressId;
        const addressDoc = await Address.findOne({ userId :user._id, "address._id": addressId });
        if(!addressDoc){
            const message = "Address not found."
            return res.status(404).redirect(`/addresses/${user._id}?message=${encodeURIComponent(message)}`);
        }
        
        await Address.updateOne(
            { userId : user._id },
            { $pull: { address: { _id: addressId } } }
        );
        // Successful update
        const successMessage = "Address deleted successfully!";
        res.redirect(`/addresses/${user._id}?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
    } catch (error) {
        console.error("Error deleting address(deleteAddress)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while deleting the address.", req.headers.referer || `/addresses/${req.body.userId}`);
    }
}
module.exports={
    getAddressesView,
    getAddAddress,
    postAddAddress,
    getEditAddress,
    postEditAddress,
    deleteAddress
}