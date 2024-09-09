const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const shart = require("sharp");
const path = require("path");




const getProductAddPage = async (req,res)=>{
    try {
            const categories = await Category.find({status:"Listed"})
            const brands  = await Brand.find({isBlocked:false});
            
            res.render("product-add",{categories,brands});
       
        
        
    } catch (error) {
        return res.redirect("/pageerror")
    }
}

const postAddProduct = async (req, res) => {
    try {
        // Validate that at least 3 images were uploaded
        if (!req.files || req.files.length < 3) {
            return res.status(400).send('Please upload at least three images.');
        }

        // Get all data from request body
        const { productName, description, brand, category, regularPrice, salePrice, weight, quantity } = req.body;

        // Server-side validation
        if (!productName || !description || !brand || !category || !regularPrice || !salePrice || !quantity) {
            return res.status(400).send('All fields are required.');
        }

        // Process the images
        const productImages = req.files.map(file => file.filename);

        // Create new product
        const newProduct = new Product({
            productName,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            weight,
            quantity,
            productImages
        });

        await newProduct.save();

        // Redirect to add product page after successful submission
        res.redirect('/admin/addProduct');
    } catch (error) {
        console.error('Error adding product:', error);
        res.redirect('/pageerror');
    }
};

module.exports = {
    getProductAddPage,
    postAddProduct
};


