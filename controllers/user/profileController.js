const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Wishlist = require("../../models/wishlistSchema");
const Cart = require("../../models/cartSchema");
const Address = require("../../models/addressSchema");
const mongoose = require('mongoose');
const { render } = require("ejs");



// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
}

const getProfileView = async (req,res) => {
    try {
        const userId = req.params.id;
        const [user, orders = [], wishlists = [], cartItems = [], addresses = []] = await Promise.all([
            User.findById(userId),
            Order.find({ user: userId }),
            Wishlist.find({ user: userId }),
            Cart.find({ user: userId }),
            Address.find({ user: userId })
        ]);


        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'Pending').length;
        const completedOrders = orders.filter(order => order.status === 'Completed').length;
        const returnedOrders = orders.filter(order => order.status === 'Returned').length;

        res.render('profileView', {
            title: 'User Profile',
            activePage: 'dashboard',
            user,
            totalOrders: totalOrders || 0,
            pendingOrders: pendingOrders || 0,
            completedOrders: completedOrders || 0,
            returnedOrders: returnedOrders || 0,
            orders, 
            wishlists: wishlists || [],
            cartItems: cartItems || [],
            addresses: addresses || []
         });
    } catch (error) {
        console.error("Server error in profile view:", error);
        renderErrorPage(res, 500, "Server Error", "An error occurred while trying to load the profile page.", req.headers.referer || '/');
    }   
}
const getEditUser = async (req,res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        res.render('editUser', {
            user,
            title: 'User Edit Form',
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        renderErrorPage(res, 500, "Server Error", "An error occurred while trying to load the edit profile form page.", req.headers.referer || '/');
        

    }
}

const postEditUser = async (req,res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        const { name, email, phone } = req.body;
        if (!name || !email || !phone) {
            return res.status(400).render('editUser', {
                user,
                title: 'User Edit Form',
                errorMessage: 'All fields are required.'
            });
        }

        const existingUser = await User.findOne({ email: email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).render('editUser', {
                user,
                title: 'User Edit Form',
                errorMessage: 'Email already exists. Please use a different email.'
            });
        }

        const editedUser = await User.findByIdAndUpdate(userId, {
            name: name,
            email: email,
            phone: phone
        }, { new: true });
        
        if (!editedUser) {
            return res.status(404).send('User not found');
        }
        res.redirect(`/profileview/${userId}`);
    } catch (error) {
        console.error('Error updating user profile:', error);
        renderErrorPage(res, 500, "Server Error", "An error occurred while trying to update the profile.", req.headers.referer || '/');
    }
}
module.exports ={
    getProfileView,
    getEditUser,
    postEditUser
}