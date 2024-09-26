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
        const skip = (productPage - 1) * productLimit; 

        // Sorting setup
        const sortOption = req.query.sort || ''; // Default sorting is by popularity
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
            case 'popularity':
                sortCriteria = { popularity: -1 };
                break;
            default:
                sortCriteria = {}; // Default sorting
        }

        // Searching setup
        const searchTerm = req.query.search || '';
        let productQuery = { isDeleted: false };

        let products = [];

        if (searchTerm) {
            // First query for "starts with" the search term
            const startsWithRegex = new RegExp(`^${searchTerm}`, 'i');
            const startsWithProducts = await Product.find({
                isDeleted: false,
                productName: { $regex: startsWithRegex }
            })
            .populate('category')
            .populate('brand')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .collation({ locale: 'en', strength: 2 })
            .sort(sortCriteria)
            .skip(skip)
            .limit(productLimit);


            // Then query for "contains" the search term, excluding already fetched products
            const containsRegex = new RegExp(searchTerm, 'i');
            const containsProducts = await Product.find({
                isDeleted: false,
                productName: { $regex: containsRegex },
                _id: { $nin: startsWithProducts.map(p => p._id) } // Exclude products already fetched
            })
            .populate('category')
            .populate('brand')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .collation({ locale: 'en', strength: 2 })
            .sort(sortCriteria)
            .skip(skip)
            .limit(productLimit);

             // Merge the results: "starts with" products first, followed by "contains" products
             products = [...startsWithProducts, ...containsProducts];
            
        }else{
             // If no search term, fetch products normally
             products = await Product.find(productQuery)
             .populate('category')
             .populate('brand')
             .populate({
                 path: 'reviews',
                 populate: { path: 'user', select: 'name' }
             })
             .collation({ locale: 'en', strength: 2 })
             .sort(sortCriteria)
             .skip(skip)
             .limit(productLimit);
        }
        

        // Total product count for pagination
        let totalProducts;
        if (searchTerm) {
            // Count total products matching the search criteria
            const searchRegex = new RegExp(searchTerm, 'i');
            totalProducts = await Product.countDocuments({
                isDeleted: false,
                productName: { $regex: searchRegex }
            });
        } else {
            // If no search term, count total products normally
            totalProducts = await Product.countDocuments(productQuery);
        }


    console.log('Sort Criteria:', sortCriteria);
    console.log('Products:', products.map(p => p.productName));


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
