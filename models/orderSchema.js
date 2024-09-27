const mongoose = require("mongoose");
const {Schema} = mongoose;


const orderSchema = new Schema({
    
    userId: {
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    orderedItems:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:"Product",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        priceOfProduct:{
            type:Number,
            default:0
        },
        priceOfQuantity:{
            type:Number,
            default:0
        }
    },{ timestamps :true}],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:"Address",
        required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:["Pending","Processing","Shipped","Delivered","Cancelled","Return Request","Returned"]
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    paymentStatus :{
        type:String,
        required:true,
        enum:["Cash on Delevery" ,"Paid"],
        default:"Cash on Delevery"

    }
}, {
    timestamps: true

})

const Order = mongoose.model("Order",orderSchema);
module.exports = Order;