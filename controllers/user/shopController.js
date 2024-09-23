const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');




const viewAllProducts = async (req,res)=>{
    try {
        res.render("shop",{
            title:"Shop Items"
        });
    } catch (error) {
        
    }
}



module.exports = {
    viewAllProducts
}