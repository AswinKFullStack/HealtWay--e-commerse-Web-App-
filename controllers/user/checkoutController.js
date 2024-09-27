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
        const { addressPage = 1, addressLimit = 3 ,cartPage = 1 ,cartLimit = 10} = req.query;
        const user =await User.findById(req.session.user);

        let {cartMessage ,addressMessage} = req.query; 

        const addressDoc = await Address.findOne({userId :req.session.user}).select('address').lean();

        let paginatedAddresses = [];
        let totalAddressPages = 1;
        let currentAddressPage =addressPage;
        
       

        if (addressDoc && addressDoc.address.length > 0) {
            const sortedAddresses = addressDoc.address.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
            const dateB = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
            return dateB - dateA;
        });

        const totalAddresses = sortedAddresses.length;
        totalAddressPages = Math.ceil(totalAddresses / addressLimit);
        currentAddressPage = Math.max(1, Math.min(addressPage, totalAddressPages));

        const startIndex = (currentAddressPage - 1) * addressLimit;
        const endIndex = startIndex + addressLimit;

         paginatedAddresses = sortedAddresses.slice(startIndex, endIndex);
        
    }
    else {
        addressMessage = "No addresses found.";
    }



    let cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
    const cartId = cart._id;
    let paginatedCartItems = [];
    let totalCartPrice = 0;
    let totalCartPages = 1;
    let currentCartPage = cartPage;

    if (cart && cart.items.length > 0) {
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);

            if (!product || product.isDeleted || product.status !== "Available" || product.quantity === 0) {
                cart.items.splice(i, 1);
                i--; 
                continue;
            }

            if (product.quantity < item.quantity) {
                item.quantity = product.quantity;
                item.totalPrice = product.salePrice * item.quantity;
            }

            totalCartPrice += item.totalPrice;
        }

        cart.totalCartPrice = totalCartPrice;
        await cart.save();

        const totalCartItems = cart.items.length;
        totalCartPages = Math.ceil(totalCartItems / cartLimit);
        currentCartPage = Math.max(1, Math.min(cartPage, totalCartPages));

         paginatedCartItems = cart.items.slice((currentCartPage - 1) * cartLimit, currentCartPage * cartLimit);

        } else {
            cart = { items: [], totalCartPrice: 0 };
            cartMessage = "Your cart is empty." ;
        }
        
        res.render('checkout',{
            title : "Check Out Page",
            user,
            cartId,
            addresses: paginatedAddresses, 
            cart: {
                items: paginatedCartItems,
                totalCartPrice: cart.totalCartPrice
            },
            currentAddressPage,
            currentCartPage, 
            totalCartPages,
            totalAddressPages,
            cartMessage,
            addressMessage,
            addressLimit,
            cartLimit,
        });




        
    } catch (error) {
        console.error("Error in checkoutLoad method:", error);
        const backLink = req.headers.referer || `/cartView`;
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while loading checkoutpage", backLink);
        
    }
}


module.exports = {
    checkoutLoad
}