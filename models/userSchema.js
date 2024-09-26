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
    googleId:{
        type:String,
        unique:true
    },
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
    referalCode:{
        type:String,
         required:false
    },
    redeemed:{
        type:Boolean,
        default: false
    },
    redeemUser:[{
        type:Schema.Types.ObjectId,
        ref:"User",
        
    }],
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