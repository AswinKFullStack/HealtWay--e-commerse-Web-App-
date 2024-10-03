const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Wishlist = require("../../models/wishlistSchema");
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

const getProductView = async (req, res) => {
    try {
        const productId = req.params.productId;
        const message = req.query.message || null;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            console.error("Invalid or missing Product ID");
            return renderErrorPage(res, 400, "Bad Request", "Product ID is required and must be valid.", req.headers.referer || '/');
        }

        const user = req.session.user ? await User.findById(req.session.user) : null;
        let isCartItem = null;
        let iswishlistItem = null;
        let cartProductIds = []; 
        let wishlistProductIds = [];
        if (user) {
            const userCart = await Cart.findOne({ userId: user._id }).lean();
            if (userCart && userCart.items) {
                cartProductIds = userCart.items.map(item => item.productId.toString());

                isCartItem = cartProductIds.includes(productId);
                
                if (isCartItem) {
                    console.log("Main item found in cart.");
                } else {
                    console.log("Main item not found in cart.");
                }
            } else {
                console.log("Cart is empty.");
            }
            //wishlist
            const userWishlist = await Wishlist.findOne({ userId: user._id }).lean();
            if (userWishlist && userWishlist.products.length > 0) {
                wishlistProductIds = userWishlist.products.map(productId => productId.toString());
                iswishlistItem = wishlistProductIds.includes(productId);
            }


        } else {
            console.log("No user found.");
        }

        const product = await Product.findById(productId)
            .populate('brand', 'brandName')
            .populate('category', 'name')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .exec();

        if (!product) {
            console.error(`Product with ID ${productId} not found`);
            return renderErrorPage(res, 404, "Product Not Found", "The product you are looking for does not exist.", req.headers.referer || '/');
        }

        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 6;
        const relatedProductsQuery = Product.find({ category: product.category._id, _id: { $ne: productId } })
            .populate('category')
            .populate('brand')
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalRelatedProducts = await Product.countDocuments({ category: product.category._id, _id: { $ne: productId } });
        const relatedProducts = await relatedProductsQuery;

        const totalPages = Math.ceil(totalRelatedProducts / itemsPerPage);

        res.render('productView', {
            product: product,
            relatedProducts: relatedProducts,
            relatedProductCurrentPage: page,
            relatedProductTotalPages: totalPages,
            title: product.productName || 'Product Details',
            user,
            message,
            isCartItem: isCartItem || null, 
            iswishlistItem :iswishlistItem || null,
            cartProductIds: cartProductIds, 
            wishlistProductIds: wishlistProductIds,
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching product details. Please try again later.", req.headers.referer || '/');
    }
};

module.exports = {
    getProductView,
};

