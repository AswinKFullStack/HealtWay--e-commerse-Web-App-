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
    offerPrice: {
        type: Number,
        min: [0, 'Offer price must be a positive number'],
        default: null
    },
    status: {
        type: String,
        enum: ['Listed', 'Unlisted'],
        default: 'Unlisted'

    },
    isDeleted: {
        type: Boolean,
        default: false, 
      },
    
 },{timestamps:true})

 const Category = mongoose.model("Category",categorySchema);
 module.exports = Category;