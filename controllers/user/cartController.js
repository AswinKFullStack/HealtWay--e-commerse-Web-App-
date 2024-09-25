const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');
const { parse } = require("dotenv");


const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};







const addCart = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId } = req.params;
        const cartItemQuantity = parseInt(req.body.quantity, 10) || 1;
        const currentPage = req.query.page || 1;

        // **1. Validate User ID**
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            const message = "Invalid User ID.";
            return res.status(400).send(message);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // **2. Validate Product ID**
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const message = "Invalid Product ID.";
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        // **3. Fetch Product**
        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            const message = "Product not found or has been deleted.";
            return res.status(404).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        // **4. Validate Product Status and Stock**
        if (product.status !== "Available" || product.quantity < 1) {
            const message = product.quantity < 1 ? "Product not in stock." : `This product is ${product.status}.`;
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        // **5. Validate Quantity Against User Buy Limit**
        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;
        if (cartItemQuantity > userBuyLimitInQuantity) {
            const message = `Only ${userBuyLimitInQuantity} unit(s) allowed per order of this product (${product.productName}).`;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
        }

        // **6. Fetch User's Cart**
        let cartDoc = await Cart.findOne({ userId: user._id });

        if (cartDoc) {
            // **6a. Check if Product Already Exists in Cart**
            const existingCartItem = cartDoc.items.find(item => item.productId.toString() === productId);
            if (existingCartItem) {
                // **6b. Product Already in Cart - Do Not Update**
                const message = `The product (${product.productName}) is already in your cart. To modify its quantity, please use the cart update option.`;
                return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            } else {
                // **6c. Add New Product to Existing Cart**
                cartDoc.items.push({
                    productId: product._id,
                    price: product.salePrice,
                    quantity: cartItemQuantity,
                    totalPrice: product.salePrice * cartItemQuantity
                });
            }
        } else {
            // **7. Create a New Cart if It Doesn't Exist**
            cartDoc = new Cart({
                userId: user._id,
                items: [{
                    productId: product._id,
                    price: product.salePrice,
                    quantity: cartItemQuantity,
                    totalPrice: product.salePrice * cartItemQuantity
                }]
            });
        }

        // **8. Update Cart Totals**
        await cartDoc.updateTotal();

        // **9. Save Cart**
        await cartDoc.save();

        // **10. Redirect with Success Message**
        const successMessage = `Product (${product.productName}) added successfully!`;
        return res.status(200).redirect(`/cartView?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);

    } catch (error) {
        console.error("Error in addCart method:", error);
        const backLink = req.headers.referer || `/product/view/${req.params.productId}`;
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while adding the product to the cart.", backLink);
    }
};






////// Loading the cart page 

const LoadCartPage = async (req, res) => {
    try {
        const { message = null, page = 1, limit = 3 } = req.query;

        const user = await User.findById(req.session.user);
        if (!user) {
            const backLink = req.headers.referer || '/';
            return renderErrorPage(res, 404, "User not found", "User needs to log in", backLink);
        }

        // Fetch user's cart
        let cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart || !cart.items.length) {
            console.log("User doesn't have products in the cart");
            const message = "Your cart is empty.";
            return res.render('cartView', {
                title: 'Cart Management',
                user,
                cart: { items: [], totalCartPrice: 0 },
                message,
                currentPage: 1,
                totalPages: 1
            });
        }

        // Loop through each cart item and validate product stock and availability
        let totalCartPrice = 0;
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);

            if (!product || product.isDeleted || product.status !== "Available" || product.quantity === 0) {
                // If product is not available, remove it from the cart
                cart.items.splice(i, 1);
                i--;  // Adjust index since we've removed the item
                continue;
            }

            // If product quantity is less than cart quantity, update cart quantity
            if (product.quantity < item.quantity) {
                item.quantity = product.quantity;
                item.totalPrice = product.salePrice * item.quantity;
            }

            // Calculate total price of the cart
            totalCartPrice += item.totalPrice;
        }

        // Update total cart price
        cart.totalCartPrice = totalCartPrice;
        await cart.save();

        // Pagination logic
        const totalItems = cart.items.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages)); // Ensure current page is within bounds

        // Calculate the items to display on the current page
        const paginatedItems = cart.items.slice((currentPage - 1) * limit, currentPage * limit);

        res.render('cartView', {
            title: 'Cart Management',
            user,
            cart: {
                items: paginatedItems,
                totalCartPrice: cart.totalCartPrice
            },
            message,
            currentPage,
            totalPages
        });

    } catch (error) {
        console.error("Error in LoadCartPage:", error);
        const backLink = req.headers.referer || '/';
        renderErrorPage(res, 500, "Internal Server Error", "An error occurred while loading the cart page", backLink);
    }
};




const cartUpdate = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, cartItemId } = req.params;
        const cartItemNewQuantity = parseInt(req.body.quantity, 10);

        // Validate user ID and fetch user
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).send('Invalid user ID.');
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Validate productId and cartItemId
        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(cartItemId)) {
            const message = "Invalid Product ID or Cart Item ID.";
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

        // Fetch product
        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            const message = "Product not found or has been deleted.";
            return res.status(404).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

        // Validate product status and stock
        if (product.status !== "Available") {
            const message = `This product is currently ${product.status}.`;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

        if (product.quantity < 1) {
            const message = "Product is out of stock.";
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

        // Validate new quantity
        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;
        if (cartItemNewQuantity < 1) {
            const message = `Quantity cannot be less than 1 for ${product.productName}.`;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }
        if (cartItemNewQuantity > userBuyLimitInQuantity) {
            const message = `Only ${userBuyLimitInQuantity} unit(s) allowed per order for ${product.productName}.`;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${req.query.page || 1}`);
        }

        // Fetch user's cart
        let cartDoc = await Cart.findOne({ userId: user._id });

        if (cartDoc) {
            // Find the specific cart item
            const cartItem = cartDoc.items.id(cartItemId);
            if (cartItem) {
                // Update existing cart item
                cartItem.price = product.salePrice;
                cartItem.quantity = cartItemNewQuantity;
                cartItem.totalPrice = cartItemNewQuantity * product.salePrice;

                // Save the cart
                await cartDoc.updateTotal();
                

                const successMessage = `Successfully updated ${cartItemNewQuantity} unit(s) of ${product.productName} in your cart.`;
                return res.redirect(`/cartView?message=${encodeURIComponent(successMessage)}&page=${req.query.page || 1}`);
            } else {
                // Cart exists but the item does not; optionally, handle this case
                const message = "Cart item not found.";
                return res.status(404).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${req.query.page || 1}`);
            }
        } else {
            // Cart does not exist; create a new cart with the item
            cartDoc = new Cart({
                userId: user._id,
                items: [{
                    productId: product._id,
                    price: product.salePrice,
                    quantity: cartItemNewQuantity,
                    totalPrice: cartItemNewQuantity * product.salePrice
                }]
            });

            await cartDoc.updateTotal();
            

            const message = `Successfully added ${product.productName} to your cart.`;
            return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

    } catch (error) {
        console.error("Error in cartUpdate:", error);
        const backLink = req.headers.referer || `/cartView`;
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while updating the cart.", backLink);
    }
};


const removeCartItem = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, cartItemId } = req.params;
        

        // Validate User ID
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID.' });
        }

        // Find the user's cart
        let cartDoc = await Cart.findOne({ userId });
        if (!cartDoc) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        // Check if the item exists in the cart
        const itemIndex = cartDoc.items.findIndex(item => item._id.toString() === cartItemId && item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        // Remove the item
        cartDoc.items.splice(itemIndex, 1);
        await cartDoc.updateTotal();

        // If the cart is empty, delete it (optional)
        if (cartDoc.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({ success: true, message: 'Cart is now empty.' });
        }

        // Save the updated cart
        await cartDoc.save();

        // Send a success response
        return res.status(200).json({ success: true, message: 'Item removed from cart successfully!' });
    } catch (error) {
        console.error("Error in removeCartItem method:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};



module.exports = {
    addCart,
    LoadCartPage,
    cartUpdate,
    removeCartItem
};
