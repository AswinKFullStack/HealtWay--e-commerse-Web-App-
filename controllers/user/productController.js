const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');

// Centralized error rendering function
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Render the product view page
const getProductView = async (req, res) => {
    try {
        const productId = req.params.productId;
        const message = req.query.message || null;

        // Validate product ID
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            console.error("Invalid or missing Product ID");
            return renderErrorPage(res, 400, "Bad Request", "Product ID is required and must be valid.", req.headers.referer || '/');
        }

        // Fetch user data from the session
        const user = req.session.user ? await User.findById(req.session.user) : null;
        let isCartItem = null;
        let cartProductIds = []; // Initialize an array to hold product IDs in the cart

        if (user) {
            // Fetch the user's cart
            const userCart = await Cart.findOne({ userId: user._id }).lean();
            if (userCart && userCart.items) {
                // Extract all product IDs from the cart items
                cartProductIds = userCart.items.map(item => item.productId.toString());

                // Check if the main product is in the cart
                isCartItem = cartProductIds.includes(productId);
                
                if (isCartItem) {
                    console.log("Main item found in cart.");
                } else {
                    console.log("Main item not found in cart.");
                }
            } else {
                console.log("Cart is empty.");
            }
        } else {
            console.log("No user found.");
        }

        // Fetch the product details
        const product = await Product.findById(productId)
            .populate('brand', 'brandName')
            .populate('category', 'name')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .exec();

        // Check if product was found
        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return renderErrorPage(res, 404, "Product Not Found", "The product you are looking for does not exist.", req.headers.referer || '/');
        }

        // Fetch related products with pagination
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 6;
        const relatedProductsQuery = Product.find({ category: product.category._id, _id: { $ne: productId } })
            .populate('category')
            .populate('brand')
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalRelatedProducts = await Product.countDocuments({ category: product.category._id, _id: { $ne: productId } });
        const relatedProducts = await relatedProductsQuery;

        // Calculate total pages for pagination
        const totalPages = Math.ceil(totalRelatedProducts / itemsPerPage);

        res.render('productView', {
            product: product,
            relatedProducts: relatedProducts,
            relatedProductCurrentPage: page,
            relatedProductTotalPages: totalPages,
            title: product.productName || 'Product Details',
            user,
            message,
            isCartItem: isCartItem || null, // For main product
            cartProductIds: cartProductIds, // Pass the array of cart product IDs
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching product details. Please try again later.", req.headers.referer || '/');
    }
};

module.exports = {
    getProductView,
};

