const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewShema");

const getProductView = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Fetch the product details
        const product = await Product.findById(productId)
            .populate('brand', 'brandName')
            .populate('category', 'name')
            .populate({
                path: 'reviews',
                populate: { path: 'user', select: 'name' }
            })
            .exec();
        
        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Fetch related products
        const relatedProducts = await Product.find({ category: product.category._id, _id: { $ne: productId } })
            .populate('category')
            .populate('brand')
            .limit(6); // Adjust the limit as needed

        res.render('productView', {
            product: product,
            relatedProducts: relatedProducts,
            relatedProductCurrentPage: 1, // Default to page 1
            relatedProductTotalPages: 1, // Calculate the total pages based on related products count
            title: product.productName || 'Product Details'
        });
    } catch (error) {
        console.error("Error fetching product details:", error);
        res.status(500).send("Server error");
    }
};

module.exports = { 
    getProductView, 
};

