const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { Schema } = mongoose;

// Individual Ordered Item Schema
const individualOrderedItemSchema = new mongoose.Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    productUuid: {
        type: String,
        default: uuidv4
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPriceOfEachItemOrder: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Cash on Delivery", "Online"],
        
    },
    statusHistory: [{
        status: {
            type: String,
            enum: [ "Processing" ,"Shipped", "Delivered", "Cancelled", "Return Requested", "Returned"],
            required: true,
            
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Order Schema
const orderSchema = new Schema({
    orderId: {
        type: String,
        unique: true,
        default: uuidv4
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [individualOrderedItemSchema],
    totalPrice: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: "Address",
        required: true
    },
    invoiceDate: {
        type: Date
    },
    
    couponApplied: {
        type: Boolean,
        default: false
    },
    paymentOrderId :{
        type: String,
        default: false
        
    },
    paymentId :{
        type: String,
        default: false
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ["Pending", "Paid","Failed", "Refunded"],
        default: "Pending"
    },
    isConfirm:{
        type:Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
