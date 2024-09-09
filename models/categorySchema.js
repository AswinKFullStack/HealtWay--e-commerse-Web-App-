 const mongoose = require("mongoose");
 const {Schema} = mongoose;

 const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    offerPrice: {
        type: Number,
        min: [0, 'Offer price must be a positive number'],
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Inactive'
    },
    createdAt:{
        type:Number,
        default:Date.now
    }
 })

 const Category = mongoose.model("Category",categorySchema);
 module.exports = Category;