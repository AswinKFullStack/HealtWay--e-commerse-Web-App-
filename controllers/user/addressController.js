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
        const { page = 1, limit = 5 } = req.query;
        const userId = req.params.userId;
        const addresses = await Address.find({ userId })
            .select('address') // This gets all the addresses for the user
            .skip((page - 1) * limit)
            .limit(limit);

        const totalAddresses = await Address.countDocuments({ userId });

        const totalPages = Math.ceil(totalAddresses / limit);
        res.render('addresses', {
            title: 'Address management',
            addresses: addresses, 
            userId,
            currentPage:page, 
            totalPages });

    } catch (error) {
        console.error("Error fetching addresses(getAddressesView)", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while Error fetching addresses", req.headers.referer || `/profileview/${req.params.userId}`);
    }
}

module.exports={
    getAddressesView
}