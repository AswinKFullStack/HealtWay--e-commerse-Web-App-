

const Wishlist = require('../../models/wishlistSchema');
const Product = require('../../models/productSchema');


const wishListToggle =  async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.user; 

    try {
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = new Wishlist({ userId, products: [] });
        }

        const productIndex = wishlist.products.indexOf(productId);

        if (productIndex > -1) {
            wishlist.products.splice(productIndex, 1);
        } else {
            wishlist.products.push(productId);
        }

        await wishlist.save();

        res.json({
            success: true,
            isInWishlist: productIndex === -1  
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}

module.exports = {
    wishListToggle
}
