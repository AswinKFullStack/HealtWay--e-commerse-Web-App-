const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const customerInfo = async (req,res)=>{
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const sort = req.query.sort || 'newest';
        const usersPerPage = 3;

        // Fetch users based on search and sort logic
     // Query to filter out admin users and search by name
     const query = { 
        name: new RegExp(search, 'i'), 
        isAdmin: false 
    };
    const sortCriteria = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 }; // example sorting by createdAt

   

    const users = await User.find(query)
    .sort(sortCriteria)
    .skip((page - 1) * usersPerPage)
    .limit(usersPerPage);

    const totalUsers = await User.countDocuments(query);
    const totalpages = Math.ceil(totalUsers / usersPerPage);
        res.render('customers',{
            data: users, 
            totalpages, 
            currentPage: page,
            search,
            sort });

    } catch (error) {
        console.error("Admin custmers list controller ERROR  error",error);
        res.status(500).send("Server error");
    }
}

// Handle Blocking a Customer
const customerBlocked = async (req, res) => {
    try {
        const userId = req.query.id; // Get the user ID from the query parameters
        
        // Update the user's blocked status
        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: true },
            { new: true }
        );

        if (!user) {
            return renderErrorPage(res, 404, "User Not Found", "The user you are trying to block does not exist.", '/admin/users');
        }
        res.redirect('/admin/users'); // Redirect to the user list page after blocking
    } catch (error) {
        console.error("Error blocking user:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while blocking the user.", '/admin/users');
    }
};

// Handle Unblocking a Customer
const customerUnblocked = async (req, res) => {
    try {
        const userId = req.query.id; // Get the user ID from the query parameters
        
        // Update the user's blocked status
        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: false },
            { new: true }
        );

        if (!user) {
            return renderErrorPage(res, 404, "User Not Found", "The user you are trying to unblock does not exist.", '/admin/users');
        }
        res.redirect('/admin/users'); // Redirect to the user list page after unblocking
    } catch (error) {
        console.error("Error unblocking user:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while unblocking the user.", '/admin/users');
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerUnblocked
};

