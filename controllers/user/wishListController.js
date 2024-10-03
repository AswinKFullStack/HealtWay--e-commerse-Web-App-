

const Wishlist = require('../../models/wishlistSchema');
const Product = require('../../models/productSchema');
const User = require('../../models/userSchema');


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







const loadWishlistPage = async (req, res) => {
    try {
        const userId = req.session?.user;
        if (!userId) {
            return res.redirect('/login');
        }

        const [user, wishlist] = await Promise.all([
            User.findById(userId).lean(), 
            Wishlist.findOne({  userId }).populate('products').lean() 
        ]);

        if (!user) {
            return res.status(404).send('User not found');
        }

        const wishlistItems = wishlist?.products || [];
        const wishlistProductIds = wishlistItems.map(item => item._id.toString()) || [];

        res.render('wishlist', {
            wishlistItems, 
            title: 'My Wishlist',
            user,
            wishlistProductIds 
        });
    } catch (error) {
        console.error('Error loading wishlist page:', error);
        res.status(500).send('An error occurred while loading your wishlist. Please try again later.');
    }
};


module.exports = {
    wishListToggle,
    loadWishlistPage
}
