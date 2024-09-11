const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Function to handle rendering an error page with details
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render("admin-error-page", {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Fetch and Render Customer Information
const customerInfo = async (req, res) => {
    try {
        const search = req.query.search || ''; // Search term from query string
        const page = Math.max(1, parseInt(req.query.page) || 1); // Current page number with default as 1
        const sort = req.query.sort || 'newest'; // Sorting criteria
        const usersPerPage = 3; // Number of users per page

        // Query to filter out admin users and search by name
        const query = {
            name: new RegExp(search, 'i'), // Case-insensitive search by name
            isAdmin: false
        };
        
        // Determine sorting criteria
        const sortCriteria = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 };

        // Fetch users based on search, pagination, and sort logic
        const users = await User.find(query)
            .sort(sortCriteria)
            .skip((page - 1) * usersPerPage)
            .limit(usersPerPage);

        const totalUsers = await User.countDocuments(query); // Count total users for pagination
        const totalPages = Math.ceil(totalUsers / usersPerPage);

        // Render the customer information page with fetched data
        res.render('customers', {
            data: users,
            totalPages,
            currentPage: page,
            search,
            sort
        });
    } catch (error) {
        console.error("Error fetching customer information:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching customer information.", '/admin/users');
    }
};

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

