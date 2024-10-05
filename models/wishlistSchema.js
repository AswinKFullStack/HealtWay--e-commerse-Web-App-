  const mongoose = require("mongoose");
  const {Schema} = mongoose;
  

  const WishlistSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    products:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]

  })

  const Wishlist = mongoose.model("Wishlist",WishlistSchema);
  module.exports = Wishlist;