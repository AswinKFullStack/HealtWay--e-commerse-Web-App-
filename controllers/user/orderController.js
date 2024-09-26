const mongoose = require('mongoose');
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require('../../models/addressSchema');
const Order = require("../../models/orderSchema");

const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

const confirmOrder = async (req, res) => {
    try {
        console.log("ordering stated")
        const { cartId } = req.params;
        const {address: addressId, paymentMethod } = req.body;

        const user = await User.findById(req.session.user);
        if (!user) {
            return renderErrorPage(res, 404, "User not found", "User needs to log in.", req.headers.referer || '/');
        }

        const cart = await Cart.findById(cartId).populate('items.productId');
        if (!cart || !cart.items.length) {
            console.log("User doesn't have products in the cart");
            const message = "Your cart is empty.";
            return  res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }

        const productIds = cart.items.map(item => item.productId);
        const products = await Product.find({
            _id: { $in: productIds },
            isDeleted: false,
            status: "Available"
        });

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
            if (product.quantity < item.quantity || product.salePrice !== item.price) {
                item.quantity = product.quantity;
                item.totalPrice = product.salePrice * item.quantity;
            }

            // Calculate total price of the cart
            totalCartPrice += item.totalPrice;
        }

         console.log("old Total cart Price =" ,cart.totalCartPrice);
         console.log("Updated cart total price = ",totalCartPrice);
        if (cart.totalCartPrice !== totalCartPrice) {
            cart.totalCartPrice = totalCartPrice;
            await cart.save();
            const message = "The price of one or more items in your cart has been updated. Please review the updated total before proceeding with the payment.";
            console.log(message)
            return  res.status(409).res.redirect(`/checkout?cartMessage=${encodeURIComponent(message)}`);
        }

        console.log("Cart validation finished")
        console.log(addressId);
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            const message = "The requested address could not be found. Please check the address ID and try again."
            console.log(message)
            return res.status(404).redirect(`/checkout?cartMessage=${encodeURIComponent(message)}`);
        }

        const userAddress = await Address.findOne({
            userId: user._id,
            address: { $elemMatch: { _id: new mongoose.Types.ObjectId(addressId) } }
        });

        if (!userAddress) {
            const message = "The requested address could not be found. Please check the address ID and try again.";
            return res.status(404).redirect(`/checkout?cartMessage=${encodeURIComponent(message)}`);
        }
        console.log("cart and address  validation over ")
        const newOrderedItems = cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            priceOfProduct: item.price,
            priceOfQuantity: item.totalPrice,
        }));

        const newOrder = {
            userId: user._id,
            orderedItems: newOrderedItems,
            totalPrice: cart.totalCartPrice,
            finalAmount: cart.totalCartPrice * 1.05,
            address: addressId,
            status: "Processing"
        };
        console.log("going to check paymetnt method")
        console.log(paymentMethod);
        if (paymentMethod === "cashOnDelivery") {
            const order = new Order(newOrder);
            if(!order){
                return renderErrorPage(res, 400, "Order not saved", "Check order saving arrea", '/checkout');
            }else{
                console.log("saved order = ",order)
                await order.save();
                await Cart.findByIdAndDelete(cartId);
                return res.redirect('/cartView');
            }
            

            //return res.redirect('/orderConfirmation?orderId=' + order._id);
        } else if (paymentMethod === "onlinePayment") {
            return res.redirect('/paymentGateway?orderId=' + newOrder._id);
        } else {
            return renderErrorPage(res, 400, "Invalid Payment Method", "Please choose a valid payment method.", '/checkout');
        }

    } catch (error) {
        console.error("Error during order confirmation:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later.", '/');
    }
};

module.exports = {
    confirmOrder
};
