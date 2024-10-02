const mongoose = require("mongoose");
const {Schema}= mongoose;


const couponSchema = new Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    code: {
        type: String,
        required: true,
        unique: true
      },
      discountType: {
        type: String, // 'percentage' or 'amount'
        required: true
      },
      discountValue: {
        type: Number,
        required: true
      },
      minPurchase:{
        type:Number,
        required:true
    },
      usageLimit: {
        type: Number,
        default: 1
      },
      usedCount: {
        type: Number,
        default: 0
      },
      
      usedBy: {
        type: Map,  // Use Map for a key-value structure.
        of: Number  // Each value in the Map is a Number representing the count.
      },
    
      expireDate:{
        type:Date,
        required:true,
    },
    isActive: {
        type: Boolean,
        default: true
      }
},{timestamps :true});

const Coupon = mongoose.model("Coupon",couponSchema);
module.exports = Coupon;