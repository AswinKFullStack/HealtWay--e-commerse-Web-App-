const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewShema");

const getProductView = async (req, res) => {
    try {
        const productId = req.params.id;

        // Fetch the product details and related reviews
        const product = await Product.findById(productId)
          .populate('brand', 'brandName') // Populate brand data
          .populate('category', 'name') // Populate category data
          .populate({
            path: 'reviews',
            populate: { path: 'user', select: 'name' } // Populate review user names
          })
          .exec();

        if (!product) {
            return res.status(404).send("Product not found");
        }

        // Render the product details page with the fetched product
        res.render('productView', {
            product: product,
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

