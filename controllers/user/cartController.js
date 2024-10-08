const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");

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

        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            const message = "Invalid User ID.";
            return res.status(400).send(message);
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const message = "Invalid Product ID.";
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        
        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            const message = "Product not found or has been deleted.";
            return res.status(404).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        if (product.status !== "Available" || product.quantity < 1) {
            const message = product.quantity < 1 ? "Product not in stock." : `This product is ${product.status}.`;
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

       
        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;
        if (cartItemQuantity > userBuyLimitInQuantity) {
            const message = `Only ${userBuyLimitInQuantity} unit(s) allowed per order of this product (${product.productName}).`;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
        }

       
        let cartDoc = await Cart.findOne({ userId: user._id });

        if (cartDoc) {
            
            const existingCartItem = cartDoc.items.find(item => item.productId.toString() === productId);
            if (existingCartItem) {
                
                const message = `The product (${product.productName}) is already in your cart. To modify its quantity, please use the cart update option.`;
                return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            } else {
                const price = product.salePrice || product.regularPrice;
                const discount = product.salePrice ? product.regularPrice - product.salePrice : 0;
                cartDoc.items.push({
                    productId: product._id,
                    price: product.regularPrice,
                    quantity: cartItemQuantity,
                    totalPrice: product.regularPrice * cartItemQuantity,
                    discount : discount,
                    finalTotalPrice : price * cartItemQuantity,

                });
            }
        } else {
            
            cartDoc = new Cart({
                userId: user._id,
                items: [{
                    productId: product._id,
                    price: product.regularPrice,
                    quantity: cartItemQuantity,
                    totalPrice: product.regularPrice * cartItemQuantity,
                    discount : product.regularPrice - product.salePrice,
                    finalTotalPrice : product.salePrice * cartItemQuantity,
                }]
            });
        }

       
        await cartDoc.updateTotal();

       
        await cartDoc.save();

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

        let cart = await Cart.findOne({
             userId: user._id })
            .populate('items.productId');
        
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

        let totalCartPrice = 0;
        let totalDiscount = 0;
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);

            const isProductAvailable = (product) => {
                return product && !product.isDeleted && product.status === "Available" && product.quantity > 0;
            };
            
            if (!isProductAvailable(product)) {
                cart.items.splice(i, 1);
                i--;
                continue;
            }
            

            if (product.quantity < item.quantity || product.salePrice !== (item.price - item.discount)) {
                item.price = product.regularPrice;
                item.quantity = product.quantity; 
                item.totalPrice = product.regularPrice * item.quantity;
                item.discount = product.regularPrice - product.salePrice || 0;
                item.finalTotalPrice = (product.salePrice || product.regularPrice) * item.quantity;
            }            

            totalCartPrice += item.finalTotalPrice;
            totalDiscount += item.discount * item.quantity;
        }

        cart.totalCartPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        cart.finalTotalCartPrice = totalCartPrice;
        await cart.save();
        

        const totalItems = cart.items.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages)); 

        const paginatedItems = cart.items.slice((currentPage - 1) * limit, currentPage * limit);

        res.render('cartView', {
            title: 'Cart Management',
            user,
            cart: {
            
                items: paginatedItems,
                totalCartPrice: cart.totalCartPrice,
                totalDiscount ,
                finalTotalCartPrice :  cart.finalTotalCartPrice,
            },
            message,
            currentPage,
            totalPages,
            
            
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
        const {  cartItemId ,productId } = req.params;
        const cartItemNewQuantity = parseInt(req.body.quantity, 10);

        if (![userId, productId, cartItemId].every(mongoose.Types.ObjectId.isValid)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID, Product ID, or Cart Item ID.' });
        }
        

        const user = await User.findById(userId);
        if (!user) {    
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

       

        const product = await Product.findOne({ _id: productId, isDeleted: false });
        if (!product) {
            const message = "Product not found or has been deleted.";
           
            return res.status(404).json({ success: false, message });
        }

        if (product.status !== "Available") {
            const message = `This product is currently ${product.status}.`;
            return res.status(404).json({ success: false, message });
        }

        if (product.quantity < 1) {
            return res.status(404).json({ success: false, message: "Product is out of stock." });
        }
        

        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;
        if (cartItemNewQuantity < 1) {
            const message = `Quantity cannot be less than 1 for ${product.productName}.`;
            
            return res.status(404).json({ success: false, message });
        }
        if (cartItemNewQuantity > userBuyLimitInQuantity) {
            const message = `Only ${userBuyLimitInQuantity} unit(s) allowed per order for ${product.productName}.`;
            
                return res.status(400).json({ success: false, message });
            
            
        }

        let cartDoc = await Cart.findOne({ userId: user._id });
        if (cartDoc) {
            const cartItem = cartDoc.items.id(cartItemId);
            if (cartItem) {
                const regularPrice = product.regularPrice || 0;
                const salePrice = product.salePrice || regularPrice;
                const discount = regularPrice - salePrice;

                cartItem.quantity = cartItemNewQuantity;
                cartItem.price = regularPrice;
                cartItem.discount = discount || 0;
                cartItem.totalPrice = cartItemNewQuantity * regularPrice;
                cartItem.finalTotalPrice = cartItemNewQuantity * salePrice;

                await cartDoc.updateTotal();

               

                return res.status(200).json({
                    success: true,
                    message: `Updated cart.`,
                    itemTotalPrice: cartItem.totalPrice,
                    itemFinalPrice: cartItem.finalTotalPrice,
                    cartSummarySubtotal: cartDoc.totalCartPrice,
                    cartSummaryTotal: cartDoc.finalTotalCartPrice,
                });
            }
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};


const removeCartItem = async (req, res) => {
    try {
        const userId = req.session.user;
        const { productId, cartItemId } = req.params;
        

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid User ID.' });
        }
        const user = await User.findById(userId);
        if (!user) {
            
                return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let cartDoc = await Cart.findOne({ userId });
        if (!cartDoc) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        const itemIndex = cartDoc.items.findIndex(item => item._id.toString() === cartItemId && item.productId.toString() === productId);
        if (itemIndex === -1) {
            return res.status(404).json({ success: false, message: 'Item not found in cart.' });
        }

        cartDoc.items.splice(itemIndex, 1);
        await cartDoc.updateTotal();

        if (cartDoc.items.length === 0) {
            await Cart.deleteOne({ userId });
            return res.status(200).json({ success: true, message: 'Cart is now empty.' });
        }

        await cartDoc.updateTotal();

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
