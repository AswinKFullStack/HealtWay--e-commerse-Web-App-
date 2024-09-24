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
        type: String, // Options like '500g' or '1000g'
        required: false
    },
    quantity:{
        type:Number,
        default:1
    },
    productImages:{
        type:[String], //multiple images will be there,so that we deifine inside an array
        required:true

    },
    coupons: [{        // Added coupons field, referencing Coupon collection
        type: Schema.Types.ObjectId,
        ref: "Coupon"
    }],
    ratings: {         // Added ratings field, storing average rating
        type: Number,
        default: 0
    },
    reviews: [{        // Added coupons field, referencing Coupon collection
        type: Schema.Types.ObjectId,
        ref: "Review"
    }], // Embedded review schema
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
        default:0   // number of orderderd count of this item
    }
},
{timestamps:true}
);

const Product = mongoose.model("Product",productSchema);
module.exports = Product;