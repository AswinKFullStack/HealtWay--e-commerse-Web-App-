const mongoose = require('mongoose');
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require('../../models/addressSchema');
const Order = require("../../models/orderSchema");
const razorpayInstance = require('../../config/razorpayConfig');

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
        const {addressId, paymentMethod } = req.body;
        console.log("address ID = ",addressId,"payment Method = ", paymentMethod )

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

        

        let totalCartPrice = 0;
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);

            if (!product || product.isDeleted || product.status !== "Available" || product.quantity === 0) {
                cart.items.splice(i, 1);
                i--;  
                continue;
            }

            if (product.quantity < item.quantity || product.salePrice !== item.price) {
                item.quantity = product.quantity;
                item.totalPrice = product.salePrice * item.quantity;
            }

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

        console.log("addressId = ",addressId);
        console.log("paymentMethod = ",paymentMethod);
        const addressObjectId = new mongoose.Types.ObjectId(addressId);
        const userAddress = await Address.aggregate([
            { $match: { userId : user._id} },
            { $unwind: '$address' }, 
            { $match: { 'address._id': addressObjectId } },
            { $replaceRoot: { newRoot: '$address' } } 
        ]);


        if (!userAddress || userAddress.length === 0) {
            const message = "The requested address could not be found. Please check the address ID and try again.";
            return res.status(404).redirect(`/checkout?cartMessage=${encodeURIComponent(message)}`);
        }

        console.log("cart and address  validation over ")
        let newOrderdItems = [];
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);

        newOrderdItems.push( {
            productId :product._id ,
            quantity : item.quantity ,
            totalPriceOfEachItemOrder: (item.price*item.quantity),
            paymentMethod,
            

        });
        product.quantity -= item.quantity;
        product.save();

    }

        
        
        const newOrder = {
            userId: user._id,
            orderedItems: newOrderdItems,
            totalPrice: cart.totalCartPrice,
            finalAmount: cart.totalCartPrice,
            address: addressObjectId,
            
            
            
        };
        const order = new Order(newOrder);
        if(!order){
            return renderErrorPage(res, 400, "Order not saved", "Check order saving arrea", '/checkout');
        }
        await order.save();
        

        console.log(paymentMethod);
        if (paymentMethod === "Cash on Delivery") {
            
            
                console.log("saved orderDetails  = ",order)
                
                await Cart.findByIdAndDelete(cartId);
                return res.status(200).json({ CODsuccess: true, orderId : order._id });
                
            
            

        } else if (paymentMethod === "Online") {
            //return res.redirect('/paymentGateway?orderId=' + newOrder._id);
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: order.finalAmount * 100, // Razorpay requires amount in paise (1 INR = 100 paise)
                currency: "INR",
                receipt: `order_rcptid_${order._id}`
            });
            if(!razorpayOrder){
                return renderErrorPage(res, 400, "Online paymet issue", "error in confirm order section at else if case", '/checkout');
            }
            console.log(razorpayOrder.id);
            order.paymentOrderId = razorpayOrder.id;
            await order.save();

            console.log("after Updation = ", order);
            return res.status(200).json({ 
                OnlinePayment : true, 
                razorpayOrderId: razorpayOrder.id,
                amount: order.finalAmount ,
                razor_key_id: process.env.RAZORPAY_KEY_ID, 
                cartId 
            });
            
        }else {
            return renderErrorPage(res, 400, "Invalid Payment Method", "Please choose a valid payment method.", '/checkout');
        }

    } catch (error) {
        console.error("Error during order confirmation:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later.", '/');
    }
};




///Confirmed bill

const orderConfirmed = async (req,res) => {

    try {
        const user = await User.findById(req.session.user);
        
        if (!user) {
            return renderErrorPage(res, 404, "User not found", "User needs to log in.", req.headers.referer || '/');
        }
        
        const order = await Order.findById(req.params.orderId);
        
        
        if (!order) {
            return renderErrorPage(res, 404, "Order not found", "Check the order page ,Please Check all details", req.headers.referer || '/');
        }
        console.log("Order Details ,total price = ",order.finalAmount);
        res.render('orderConfirm',{
            title :"Order Confirmed",
            user,
            order
        });
    } catch (error) {
        console.error("Error during order confirmated bill:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred. Please try again later.", '/');
    }
}

const LoadOrderPage = async (req, res) => {
    try {
        const {  page = 1, limit = 3 } = req.query;
        const user = await User.findById(req.session.user);
        if (!user) {
            return renderErrorPage(res, 404, 'User Not Found', 'The user associated with the session was not found.', '/back-to-home');
        }

        const ordersDetailList = await Order.aggregate([
            { $match: { userId: user._id } },
            { $unwind: "$orderedItems" },
            {
                $lookup: {
                    from: "products",               
                    localField: "orderedItems.productId",
                    foreignField: "_id",            
                    as: "productDetails"            
                }
            },
            { $unwind: "$productDetails" }
        ]);

        if (!ordersDetailList.length) {
            return renderErrorPage(res, 404, 'No Orders Found', 'This user has no orders to display.', '/back-to-home');
        }

        const sortedOrdersDetailList = ordersDetailList.sort((a, b) => {
            const dateA = a.orderedItems.createdAt ? new Date(a.orderedItems.createdAt) : a.orderedItems._id.getTimestamp();
            const dateB = b.orderedItems.createdAt ? new Date(b.orderedItems.createdAt) : b.orderedItems._id.getTimestamp();
            return dateB - dateA;
        });
        const totalOrder = sortedOrdersDetailList.length;
        const totalPages = Math.ceil(totalOrder / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages)); 
        const paginatedOrder = sortedOrdersDetailList.slice((currentPage - 1) * limit, currentPage * limit);

        res.render('orderMngt', {
            title: "Order List",
            user,
            orders: paginatedOrder,
            currentPage,
            totalPages,

        });

    } catch (error) {
        console.error("Error loading orders: ", error);

        renderErrorPage(res, 500, 'Internal Server Error', 'An error occurred while loading the orders.', '/back-to-home');
    }
};

const cancelOrder = async (req,res) => {
    try {
        const {orderIdOfCartItems ,itemOrderId} = req.params;
        
        const OrderItemDoc = await Order.findOne({
            _id : orderIdOfCartItems,
            "orderedItems._id" :itemOrderId
        })

        if(!OrderItemDoc){
           
           return res.status(404).json({ success: false, message: 'Order or Order Item not found..' });
        }

        const orderedItem = OrderItemDoc.orderedItems.find(item => item._id.toString() === itemOrderId.toString());
        if (!orderedItem) {
            
            return res.status(404).json({ success: false, message: 'Ordered item not found.' });
        }
        if (orderedItem.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Item is already cancelled.' });
        }

        
        const updateOrderResult = await Order.updateOne(
            { _id: orderIdOfCartItems,  "orderedItems._id": itemOrderId },
            { $set: { "orderedItems.$.status": "Cancelled" } }
          );

          if (updateOrderResult.modifiedCount === 0) {
            return res.status(500).json({ success: false, message: 'Failed to update order status.' });
        }
          
         const productUpdateResult = await Product.updateOne(
            { _id: orderedItem.productId },
            { $inc: { quantity: orderedItem.quantity } }
            );

            console.log("Product quantity update result:", productUpdateResult);
        
            return res.status(200).json({ success: true, message: 'Order cancelled !' });

    } catch (error) {
        
        console.error("Error in cancelOrder:", error);

        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid Order or Item ID.' });
        }

        
        return res.status(500).json({ success: false, message: 'An internal server error occurred while cancelling the order.' });
    }
}





const onlinePayment = async (req,res) => {
    try {
        console.log("After online payment = order collection updation")
        const {paymentOrderId, paymentId ,cartId } = req.query;

        if (!paymentOrderId || !paymentId) {
            return res.status(400).send("Missing paymentOrderId or paymentId");
        }
        console.log("payment orderId = ",paymentOrderId," paymentId =",  paymentId)

        const order = await Order.findOne({ paymentOrderId });
        if (!order) {
            return res.status(404).send("Order not found");
        }
        order.paymentStatus = "Paid";
        order.paymentId = paymentId;

       await Cart.findByIdAndDelete(cartId);
        await order.save();
        
        return res.redirect(`/orderconfirm/${order._id}`);
    } catch (error) {
        return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred in Online payment . Please try again later.", '/');   
    }
}

module.exports = {
    confirmOrder,
    orderConfirmed,
    LoadOrderPage,
    cancelOrder,
    onlinePayment
};
