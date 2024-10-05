const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new Schema({
    type: {
        type: String,
        required: true,
        enum: ['Product', 'Category', 'Referral']
    },
    title: {
        type: String,
        required: true
    },
    discountType: {
        type: String, // 'percentage' or 'amount'
        required: true,
        enum: ['percentage', 'amount'] // Adding validation for type
    },
    discountValue: {
        type: Number,
        required: true // Will represent either the percentage or the fixed amount off
    },
    details: {
        type: String
    },
    image: {
        type: String
    },
    product: {  // Products linked to this offer (if Product offer)
        type: Schema.Types.ObjectId,
        ref: 'Product'
    },
    category: {  // Category linked to this offer (if Category offer)
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    isActive: {
        type: Boolean,
        default: true
    },
  
},{timestamps:true});

module.exports = mongoose.model('Offer', offerSchema);

