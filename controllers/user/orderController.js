const mongoose = require('mongoose');
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Cart = require("../../models/cartSchema");
const Address = require('../../models/addressSchema');
const Order = require("../../models/orderSchema");
const Coupon = require("../../models/couponShema");
const Wallet = require("../../models/walletSchema");
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
        console.log(req.body.couponId)
        console.log("ordering stated")
        const { cartId } = req.params;
        const {addressId, paymentMethod ,couponId} = req.body;
        console.log("address ID = ",addressId,"payment Method = ", paymentMethod )

        const user = await User.findById(req.session.user);
        if (!user) {
            
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const cart = await Cart.findById(cartId).populate('items.productId');
        if (!cart || !cart.items.length) {
            console.log("User doesn't have products in the cart");
            return res.status(400).json({ success: false, message: 'Your cart is empty' });
            
            
        }

        if (paymentMethod !== "Cash on Delivery" && paymentMethod !== "Online") {
            return res.status(400).json({ success: false, message: 'Invalid payment method selected' });
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
        console.log("checking the coupon is applied or not");
        let discountAmount = 0;
        let singleItemDiscountAmount = 0;
        let couponCode = null;
        if (couponId) {
            console.log("coupon Id =", couponId);
            console.log("user Id = ", user._id);
            try {
                const couponDoc = await Coupon.findOne({
                    _id: couponId,
                    minPurchase: { $lte: cart.totalCartPrice },
                    isActive: true,
                    expireDate: { $gt: new Date() },
                    $or: [
                        { $expr: { $lt: [`$usedBy.${user._id}`, "$usageLimit"] } },  // If user has used it less than the limit.
                      { [`usedBy.${user._id}`]: { $exists: false } }     // If user has never used it.
                    ]
                  });
                  

                    
                if (!couponDoc) {
                    console.error("Coupon not found or invalid for current conditions.");
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon not found or invalid for current conditions.'
                    });
                }
        
               
                
                if (couponDoc.discountType === 'Percentage') {
                    discountAmount = cart.totalCartPrice * (couponDoc.discountValue / 100);
                } else if (couponDoc.discountType === 'Fixed') {
                    discountAmount = couponDoc.discountValue;
                } else {
                    return res.status(400).json({ success: false, message: 'Invalid coupon discount type.' });
                }
        
                discountAmount = discountAmount > 0 ? discountAmount : 0;
                singleItemDiscountAmount = discountAmount / cart.items.length;
                couponCode = couponDoc.code;
        
                console.log("Total Discount =", discountAmount);
                console.log("Discount for Single Item =", singleItemDiscountAmount);
        
            } catch (error) {
                console.error("Error during coupon validation:", error);
                return res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
            }
        }
        




        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);
            product.quantity -= item.quantity;
            await product.save();
        }
        const shippingAddress = userAddress[0];

        
        
      
        

        console.log(paymentMethod);
        if (paymentMethod === "Cash on Delivery") {
               let OrderIds = [];
            for (let i = 0; i < cart.items.length; i++) {
                const item = cart.items[i];
                const totalPrice = item.totalPrice - singleItemDiscountAmount;
                const product = await Product.findById(item.productId);
                const newOrder = {
                    userId: user._id,
                    productId :product._id ,
                    quantity : item.quantity ,
                    totalPrice : totalPrice > 0 ? totalPrice : 0,
                    orderStatus : 'Confirmed' ,
                    paymentDetails :{method : paymentMethod },
                    shippingAddress ,  
                    groupId : cart._id,
                    couponCode :couponCode || null,
                };

                const order = new Order( newOrder);
                await order.save();
                OrderIds.push(order._id);
                
    
            }
    
            
                const TotalPrice = cart.totalCartPrice - discountAmount;
                await Cart.findByIdAndDelete(cartId);
                if (req.body.couponId) {
                    const couponId = req.body.couponId;
                    await Coupon.updateOne(
                        { _id: couponId },
                        { 
                          $set: { 
                            [`usedBy.${user._id}`]: { $ifNull: [`$usedBy.${user._id}`, 0] }  
                          },
                          $inc: { 
                            [`usedBy.${user._id}`]: 1,  
                            usedCount: 1                
                          },
                          $set: { updatedAt: new Date() }  
                        }
                      );
                      
                
                    
                }
                
                return res.status(200).json({ CODsuccess: true, groupId : cart._id ,TotalPrice});
                
            
            

        } else if (paymentMethod === "Online") {
            const TotalPrice = cart.totalCartPrice - discountAmount;

            const razorpayOrder = await razorpayInstance.orders.create({
                amount: TotalPrice * 100, // Razorpay requires amount in paise (1 INR = 100 paise)
                currency: "INR",
                receipt: `order_rcptid_${cart._id}`
            });
            if(!razorpayOrder){
                return renderErrorPage(res, 400, "Online paymet issue", "error in confirm order section at else if case", '/checkout');
            }

            return res.status(200).json({ 
                OnlinePayment : true, 
                razorpayOrderId: razorpayOrder.id,
                amount: cart.totalCartPrice ,
                razor_key_id: process.env.RAZORPAY_KEY_ID, 
                addressId,
                cartId ,
                couponId

            });
            
        }else {
            return renderErrorPage(res, 400, "Invalid Payment Method", "Please choose a valid payment method.", '/checkout');
        }

    } catch (error) {
        console.error("Error during order confirmation:", error);
        
        return res.status(500).json({ success: false, message: "An error occurred while confirming your order. Please try again later." });
    }
};




///Confirmed bill

const orderConfirmed = async (req,res) => {

    try {
        const user = await User.findById(req.session.user);
        const {groupId} = req.params;
        const { totalPrice } = req.query;
        
        if (!user) {
            return renderErrorPage(res, 404, "User not found", "User needs to log in.", req.headers.referer || '/');
        }
        
        const order = await Order.findOne({groupId});
        
        
        if (!order || order.length === 0) {
            return renderErrorPage(res, 404, "Order not found", "Check the order page ,Please Check all details", req.headers.referer || '/');
        }
        
        res.render('orderConfirm',{
            title :"Order Confirmed",
            user,
            order,
            totalPrice
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
            
            {
                $lookup: {
                    from: "products",               
                    localField: "productId",
                    foreignField: "_id",            
                    as: "productDetails"            
                }
            },
            
        ]);

        if (!ordersDetailList.length) {
            return renderErrorPage(res, 404, 'No Orders Found', 'This user has no orders to display.', '/back-to-home');
        }

        const sortedOrdersDetailList = ordersDetailList.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
            const dateB = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
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
        const {orderId} = req.params;
        
        const orderDoc = await Order.findById(orderId);

        if(!orderDoc){
           
           return res.status(404).json({ success: false, message: 'Order or Order Item not found..' });
        }

        
        if (orderDoc.orderStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Item is already cancelled.' });
        }

        
        const updateResult = await Order.updateOne(
            { _id: orderDoc._id},
            { $set: { "orderStatus": "Cancelled", cancellationDate: new Date() } }
          );

          if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ success: false, message: 'Failed to update order status.' });
        }
          
         const productUpdateResult = await Product.updateOne(
            { _id: orderDoc.productId },
            { $inc: { quantity: orderDoc.quantity } }
            );

            console.log("Product quantity update result:", productUpdateResult);
            
            if (orderDoc.paymentDetails.status === 'Paid') {
                const refundAmount = orderDoc.totalPrice;
                let walletDoc = await Wallet.findOne({ userId: orderDoc.userId });

                if (!walletDoc) {
                    // Create a new wallet if not exists
                    walletDoc = new Wallet({
                        userId: orderDoc.userId,
                        balance: refundAmount,
                        transactions: [{
                            type: 'credit',
                            amount: refundAmount,
                            description: `Refund for cancelled order ${orderDoc._id}`
                        }]
                    });
                    await walletDoc.save();
                } else {
                    // Update wallet balance and add transaction
                    walletDoc.balance += refundAmount;
                    walletDoc.transactions.push({
                        type: 'credit',
                        amount: refundAmount,
                        description: `Refund for cancelled order ${orderDoc._id}`
                    });
                    await walletDoc.save();
                }
    
               
    
                await Order.updateOne(
                    { _id: orderDoc._id },
                    { 
                        $set: { 
                            "orderStatus": "Refunded",  
                            "paymentDetails.refundAmount": refundAmount,
                            "paymentDetails.refundStatus": "Full"  
                        }
                    }
                );
            }
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

        const user = await User.findById(req.session.user);
        console.log("After online payment = order collection updation")
        const {razorpayOrderId, paymentId ,cartId ,addressId,couponId} = req.query;
        console.log("shipping Address Id= ", addressId);
        if (!razorpayOrderId || !paymentId) {
           
            return renderErrorPage(res, 400, "Missing paymentOrderId or paymentId", "Missing paymentOrderId or paymentId Please try again later.", '/');   
        }
        console.log("payment orderId = ",razorpayOrderId ," paymentId =",  paymentId)
        console.log("cartID = ",cartId);

        
    
        const cart = await Cart.findById(cartId);
        if (!cart) {
            console.error("Cart not found for cartId = ", cartId);
            return renderErrorPage(res, 404, "Cart not found", "The cart could not be found. Please try again later.", '/');
        }
        if (!cart.items.length) {
            console.error("Cart is empty for cartId = ", cartId);
            return renderErrorPage(res, 404, "Your cart is empty", "Your cart is empty. Please try again later.", '/');
        }
        
        const addressObjectId = new mongoose.Types.ObjectId(addressId);
        const userAddress = await Address.aggregate([
            { $match: { userId : user._id} },
            { $unwind: '$address' }, 
            { $match: { 'address._id': addressObjectId } },
            { $replaceRoot: { newRoot: '$address' } } 
        ]);
        if (!userAddress.length) {
            console.error("Shipping address not found for addressId = ", addressId);
            return renderErrorPage(res, 404, "Address not found", "The shipping address could not be found. Please try again later.", '/');
        }
        const shippingAddress = userAddress[0];
        console.log("cart details = ",cart);
        
        let discountAmount = 0;
        let singleItemDiscountAmount = 0;
        let couponCode = null;

        if (couponId && mongoose.Types.ObjectId.isValid(couponId)) {
            console.log("coupon Id =", couponId);
            console.log("user Id = ", user._id);
            try {
                const couponDoc = await Coupon.findOne({
                    _id: couponId,
                    minPurchase: { $lte: cart.totalCartPrice },
                    isActive: true,
                    expireDate: { $gt: new Date() },
                    $or: [
                        { $expr: { $lt: [`$usedBy.${user._id}`, "$usageLimit"] } },  // If user has used it less than the limit.
                      { [`usedBy.${user._id}`]: { $exists: false } }     // If user has never used it.
                    ]
                  });
                  

                    
                if (!couponDoc) {
                    console.error("Coupon not found or invalid for current conditions.");
                    return res.status(400).json({
                        success: false,
                        message: 'Coupon not found or invalid for current conditions.'
                    });
                }
        
               
                
                if (couponDoc.discountType === 'Percentage') {
                    discountAmount = cart.totalCartPrice * (couponDoc.discountValue / 100);
                } else if (couponDoc.discountType === 'Fixed') {
                    discountAmount = couponDoc.discountValue;
                } else {
                    return res.status(400).json({ success: false, message: 'Invalid coupon discount type.' });
                }
        
                discountAmount = discountAmount > 0 ? discountAmount : 0;
                singleItemDiscountAmount = discountAmount / cart.items.length;
                couponCode = couponDoc.code;
        
                console.log("Total Discount =", discountAmount);
                console.log("Discount for Single Item =", singleItemDiscountAmount);
        
            } catch (error) {
                console.error("Error during coupon validation:", error);
                return res.status(500).json({ success: false, message: "An error occurred while applying the coupon." });
            }
        }
        
        

        let OrderIds = [];
        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const totalPrice = item.totalPrice - singleItemDiscountAmount;
            const product = await Product.findById(item.productId);
            
            const newOrder = {
                userId: req.session.user,
                productId :product._id ,
                quantity : item.quantity ,
                totalPrice : totalPrice > 0 ? totalPrice : 0,
                orderStatus : 'Confirmed' ,
                paymentDetails :{method : "Online",gateway :"Razorpay",status:"Paid" ,beforePymentRefId:razorpayOrderId,paymentId},
                shippingAddress ,  
                groupId : cart._id,
                couponCode :couponCode || null,
            };

            const order = new Order( newOrder);
            await order.save();
            OrderIds.push(order._id);
            

        }

        
            
        
        const TotalPrice = cart.totalCartPrice - discountAmount;
        await Cart.findByIdAndDelete(cartId);
        if (couponId) {
            const couponId = req.body.couponId;
            await Coupon.updateOne(
                { _id: couponId },
                { 
                  $set: { 
                    [`usedBy.${user._id}`]: { $ifNull: [`$usedBy.${user._id}`, 0] }  
                  },
                  $inc: { 
                    [`usedBy.${user._id}`]: 1,  
                    usedCount: 1                
                  },
                  $set: { updatedAt: new Date() }  
                }
              );
              
        
            
        }
        return res.redirect(`/orderconfirm/${cart._id}?totalPrice=${TotalPrice}`);
    } catch (error) {
        console.error("Error during online payment processing:", error);
        return renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred during online payment processing. Please try again later.", '/');
    }
    
}



const restoreProductQuantities = async (req, res) => {
    try {
        const { cartId } = req.params;
       

        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
            const product = await Product.findById(item.productId);
            if (product) {
                product.quantity += item.quantity;
                await product.save();  
            }
        }

       
        

        res.json({ success: true, message: "Product quantities restored successfully" });
    } catch (error) {
        console.error('Error restoring cart items:', error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};




//Return product

const returnOrder = async (req,res)=>{
   
        try {
            const {orderId} = req.params;
            
            const orderDoc = await Order.findById(orderId);
    
            if(!orderDoc){
               
               return res.status(404).json({ success: false, message: 'Order or Order Item not found..' });
            }
    
            
            if (orderDoc.orderStatus === 'Returned' || orderDoc.orderStatus === 'Return Request') {
                return res.status(400).json({ success: false, message: 'Item is already return' });
            }
    
            
            const updateResult = await Order.updateOne(
                { _id: orderDoc._id},
                { $set: { "orderStatus": "Return Request" } }
              );
    
              if (updateResult.modifiedCount === 0) {
                return res.status(500).json({ success: false, message: 'Failed to update order status.' });
            }
              
             const productUpdateResult = await Product.updateOne(
                { _id: orderDoc.productId },
                { $inc: { quantity: orderDoc.quantity } }
                );
    
                console.log("Product quantity update result:", productUpdateResult);
                
              
                
                return res.status(200).json({ success: true, message: 'Order Return Requested successfull !' });
    
        } catch (error) {
            
            console.error("Error in order Return Request:", error);
    
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, message: 'Invalid Order or Item ID.' });
            }
    
            
            return res.status(500).json({ success: false, message: 'An internal server error occurred while Return Request the order.' });
        }
    
}


module.exports = {
    confirmOrder,
    orderConfirmed,
    LoadOrderPage,
    cancelOrder,
    onlinePayment,
    restoreProductQuantities,
    returnOrder
};
