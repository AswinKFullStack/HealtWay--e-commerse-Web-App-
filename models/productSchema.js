 const mongoose = require("mongoose");
 const {Schema} = mongoose;


 const productSchema = new Schema({
    productName:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    brand :{
        type:Schema.Types.ObjectId,
        ref:"Brand",
        required:true
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true
    },
    salePrice:{
        type:Number,
        required:true
    },
    productOffer:{
        type:Number,
        default:0
    },
    weight: {
        type: String, 
        required: false
    },
    quantity:{
        type:Number,
        default:1
    },
    productImages:{
        type:[String], 
        required:true

    },
    coupons: [{        
        type: Schema.Types.ObjectId,
        ref: "Coupon"
    }],
    ratings: {         
        type: Number,
        default: 0
    },
    reviews: [{        
        type: Schema.Types.ObjectId,
        ref: "Review"
    }], 
    isBlocked:{
        type:Boolean,
        default:false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    status:{
        type:String,
        enum:["Available","Out of stock","Discountinued"],
        required:true,
        default:"Available"
    },
    userBuyLimitInQuantity :{
        type:Number,
        required :false,
        default:10
    },
    popularity:{
        type:Number,
        required :false,
        default:0   
    }
},
{timestamps:true}
);

const Product = mongoose.model("Product",productSchema);
module.exports = Product;