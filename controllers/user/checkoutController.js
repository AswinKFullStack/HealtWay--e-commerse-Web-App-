const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const Address = require('../../models/addressSchema');
const mongoose = require('mongoose');
const { parse } = require("dotenv");


const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

const checkoutLoad = async (req,res) => {
    try {
        const { page = 1, limit = 3 } = req.query;
        const user =await User.findById(req.session.user);
        const message = req.query.message; // Check if message is passed in query
        const addressDoc = await Address.findOne({userId :req.session.user}).select('address').lean();

        if (!addressDoc || addressDoc.address.length === 0) {
            return res.render('checkout',{
                title : "Check Out Page",
                user,
                addresses: [],
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
        
        
        

        
        res.render('checkout',{
            title : "Check Out Page",
            user,
            addresses: paginatedAddresses, 
            currentPage, 
            totalPages,
            totalAddresses,
            limit,
        message});
        
    } catch (error) {
        console.error("Error in addCart method:", error);
        const backLink = req.headers.referer || `/cartView`;
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while loading checkoutpage", backLink);
        
    }
}


module.exports = {
    checkoutLoad
}