const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');

const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

const viewAllProducts = async (req, res) => {
    try {
        // Pagination setup
        const productPage = parseInt(req.query.page) || 1;
        const productLimit = 3; // Number of products per page

        // Sorting setup
        const sortOption = req.query.sort || 'popularity'; // Default sorting is by popularity
        let sortCriteria = {};

        switch (sortOption) {
            case 'price-high-low':
                sortCriteria = { regularPrice: -1 };
                break;
            case 'price-low-high':
                sortCriteria = { regularPrice: 1 };
                break;
            case 'ratings':
                sortCriteria = { ratings: -1 };
                break;
            case 'az':
                sortCriteria = { productName: 1 };
                break;
            case 'za':
                sortCriteria = { productName: -1 };
                break;
            default:
                sortCriteria = { popularity: -1 }; // Default sorting
        }

        // Searching setup
        const searchTerm = req.query.search || '';
        let productQuery = { isDeleted: false };

        if (searchTerm) {
            productQuery.productName = { $regex: searchTerm, $options: 'i' };
        }

        // Total product count for pagination
        const totalProducts = await Product.countDocuments(productQuery);

        // Fetch products with pagination and sorting
        const products = await Product.find(productQuery)
            .populate('category')
            .populate('brand')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .sort(sortCriteria)
            .skip((productPage - 1) * productLimit)
            .limit(productLimit);

        // Fetch user details if logged in
        const user = req.session.user 
            ? await User.findById(req.session.user) 
            : req.user 
            ? await User.findById(req.user._id) 
            : null;

        // Render the shop page
        res.render("shop", {
            user,
            products,
            productCurrentPage: productPage,
            productTotalPages: Math.ceil(totalProducts / productLimit),
            searchTerm,
            sort: sortOption, // Pass the selected sort option
            title: 'Shop Page'
        });

    } catch (error) {
        console.error("Error in fetching products:", error);
        renderErrorPage(res, 500, "Server Error", "An error occurred while loading products.", req.headers.referer || '/');
    }
};

module.exports = {
    viewAllProducts
};
