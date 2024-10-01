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
      usedBy: [
        {
          userId: mongoose.Schema.Types.ObjectId, // User who applied the coupon
          count: { type: Number, default: 0 } // Number of times this user has used the coupon
        }
      ],
      expireDate:{
        type:Date,
        required:true,
    },
    isActive: {
        type: Boolean,
        default: true
      }
},{timestamps :true})

const Coupon = mongoose.model("Coupon",couponSchema);
module.exports = Coupon;