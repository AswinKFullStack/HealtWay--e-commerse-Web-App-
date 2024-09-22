const mongoose = require("mongoose");
const {Schema} = mongoose;



const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product", // Reference to Product model
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    price: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true,
        default: function() {
            return this.quantity * this.price;
        }
    },
    status:{
        type:String,
        default:"placed"
    },
    cancellationReason:{
        type:String,
        default:"none"
    }
}, {
    timestamps: true
});


const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[cartItemSchema],
    totalCartPrice: {
        type: Number,
        required: true,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true

});

cartSchema.methods.updateTotal = function() {
    this.totalItems = this.items.length;
    this.totalCartPrice = this.items.reduce((total, item) => total + item.totalPrice, 0);
    return this.save();
};


const Cart = mongoose.model("Cart",cartSchema);
module.exports = Cart;