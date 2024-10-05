const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

// Order Schema
const orderSchema = new Schema({
 orderId: {
        type: String,
        unique: true,
        default: uuidv4
 },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, 
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true }, 
  
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true }, 
  
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded','Returned','Return Request'],
    default: 'Pending',
  },

  paymentDetails: {
    method: { type: String, enum: ["Cash on Delivery", "Online"], required: true },
    gateway: {type : String , required:false}, 
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    date: { type: Date , default: Date.now }, 
    beforePymentRefId: { 
        type: String ,
        required:false
    },     //for razro payment ,before payment 
    paymentId: { type: String ,required : false},   // after successfully payment
    refundAmount: { type: Number, default: 0 }, 
    refundStatus: { type: String, enum: ['Not Initiated', 'Partial', 'Full'], default: 'Not Initiated' },
  },

  shippingAddress: {
    addressType: {
        type: String,
        enum: ['Home', 'Work', 'Other'],  
        required: true
    },
    name:{
        type:String,
        required:true,
    },
    houseName: { 
        type: String, 
        required: true },
    city:{
        type:String,
        required:true
    },
    landMark:{
        type:String,
        required:true 
    },
    state:{
        type:String,
        required:true
    },
    pincode: {
        type: Number,
        required: true,
        min: 100000,  
        max: 999999
    },
    phone: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v);  
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    altPhone: {
        type: String,
        required: false,
        validate: {
            validator: function (v) {
                if (v == null || v.trim() === '') return true; 
                return /^\d{10}$/.test(v);  
            },
            message: props => `${props.value} is not a valid alternate phone number!`
        }
    }
  },

  discount: { type: Number, default: 0 }, 
  couponCode: { type: String }, 
  couponDiscount: { type: Number, default: 0 },
  finalTotalPrice: { type: Number, required: true }, 
  finalTotalPriceWithAllDiscount: { type: Number,required: true  },
  groupId: { type: String },
  invoiceDate: { type: Date },

  cancellationDate: { type: Date }, 

}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

