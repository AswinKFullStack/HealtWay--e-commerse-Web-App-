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
            priceOfProduct : item.price ,
            priceOfQuantity : item.totalPrice,
        });
        product.quantity -= item.quantity;
        product.save();

    }

         console.log("Address ID =",addressObjectId ,"Address TYpe =" ,typeof addressObjectId)
        console.log("New Product for Ordering fo Order Collection = ",newOrderdItems);
        const newOrder = {
            userId: user._id,
            orderedItems: newOrderdItems,
            totalPrice: cart.totalCartPrice,
            finalAmount: cart.totalCartPrice * 1.05,
            address: addressObjectId,
            status: "Processing"
        };
        console.log("The Order Full Details =",newOrder);
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
                return res.redirect(`/orderconfirm/${order._id}`);
            }
            

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

const  LoadOrderPage = async (req,res) => {
    try {
        const user = await User.findById(req.session.user);
        if (!user) {
            return res.status(404).send('User not found.');
        }
        const ordersDetailList = await Order.aggregate([{$match:{userId :user._id}},{$unwind:"$orderedItems"},{
            $lookup: {
              from: "products",              // The collection you want to join with
              localField: "orderedItems.productId", // Field from "Order" to match
              foreignField: "_id",           // Field from the "products" collection to match
              as: "productDetails"           // Output field for joined data
            }
          }, { $unwind: "$productDetails" },])
          console.log("Order Product,= " ,ordersDetailList[0]);
          console.log("Product details = ",ordersDetailList[0].productDetails)
        const sortedordersDetailList = ordersDetailList.sort((a,b)=>{
            const dateA = a.orderedItems.createdAt ? new Date(a.orderedItems.createdAt) : a.orderedItems._id.getTimestamp();
            const dateB = b.orderedItems.createdAt ? new Date(b.orderedItems.createdAt) : b.orderedItems._id.getTimestamp();
            return dateB - dateA;
        })  
        console.log("Total orders item = ",ordersDetailList.length);
        res.render('orderMngt',{
            title:"Order List",
            user,
            orders : sortedordersDetailList,
        

        });
    } catch (error) {
        
    }
}

module.exports = {
    confirmOrder,
    orderConfirmed,
    LoadOrderPage
};
