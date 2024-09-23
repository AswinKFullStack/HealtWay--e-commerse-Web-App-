const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const sharp = require('sharp');
const path = require("path");

// Function to handle rendering an error page with details
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render("admin-error-page", {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Loading Products list
const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const searchTerm = req.query.search || '';

        let query = {};
        if (searchTerm) {
            query = {
                "orderdItems.product": { $regex: searchTerm, $options: 'i' },
                
            };
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Product.find(query)
            .populate('product')
            .populate('user')
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('orders', {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            searchTerm,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching orders.", '/admin/orders');
    }
};

module.exports ={
    getOrders
}