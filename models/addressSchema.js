 const mongoose = require("mongoose");
 const {Schema} = mongoose;

 const individualAddressSchema = new mongoose.Schema({
        addressType: {
            type: String,
            enum: ['Home', 'Work', 'Other'],  // Optional: pre-defined values for address type
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
    },{ timestamps: true, _id: true });

    const addressSchema = new mongoose.Schema({
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User', 
            required: true },
        address: [individualAddressSchema] 
    }, { timestamps: true });

 const Address = mongoose.model("Address",addressSchema)
 module.exports = Address;