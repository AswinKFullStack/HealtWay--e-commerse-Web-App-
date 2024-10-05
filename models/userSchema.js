 const mongoose = require("mongoose");
 const {Schema} = mongoose;


 const userSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:false, 
        unique:false,
        spare:true, 
        default:null
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true  // Ensure this line is present
    }
    ,
    
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart: {
        type: Schema.Types.ObjectId,
        ref: "Cart"
    },
    wallet: {
        type: Schema.Types.ObjectId,
        ref: "Wallet"
    },
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Order"
    }],
    createdOn:{
        type:Date,
        default:Date.now,

    },
    referralCode: { // Each user has a referral code
        type: String,
        unique: true
    },
    referrer: { // Track who referred the new user
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    redeemedOffers: [{  // Track which referral offers the user has redeemed
        offerId: {
            type: Schema.Types.ObjectId,
            ref: "Offer"
        },
        redeemedOn: {
            type: Date,
            default: Date.now
        }
    }],
    referralRewards: { // Track the total rewards earned by referring others
        type: Number,
        default: 0
    },
    searchHistory:[{
        category:{
            type:Schema.Types.ObjectId,
            ref:"Category"
        },
        brand:{
            type:String
        },
        searchOn:{
            type:Date,
            default:Date.now
        }
   }],
 }, {
    timestamps: true
})


 const User = mongoose.model("User", userSchema);
 module.exports = User;