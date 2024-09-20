 const mongoose = require("mongoose");
 const {Schema} = mongoose;

 const addressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    address:[{
        _id: { type: Schema.Types.ObjectId, auto: true },  // Unique ID for each address
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
                    return /^\d{10}$/.test(v);  // Enforce 10 digits
                },
                message: props => `${props.value} is not a valid alternate phone number!`
            }
        }
        
    }]

 },{ timestamps: true })

 const Address = mongoose.model("Address",addressSchema)
 module.exports = Address;