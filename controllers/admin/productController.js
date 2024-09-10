const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const sharp = require('sharp');
const path = require("path");

//Loading Products list

const getProducts = async (req, res) => {
    try {
        // Extract page and search query parameters from request
        const page = parseInt(req.query.page) || 1;
        const limit = 3; // Number of products per page
        const searchTerm = req.query.search || '';

        // Build the search query based on the search term
        let query = {};
        if (searchTerm) {
            query = {
                productName: { $regex: searchTerm, $options: 'i' }, // case-insensitive search
            };
        }

        // Find the total number of products for pagination
        const totalProducts = await Product.countDocuments(query);

        // Fetch the products with pagination and search
        const products = await Product.find(query)
        .populate('category')
        .populate('brand')
        .skip((page - 1) * limit)
        .limit(limit);
      
           
        
        // Render the product listing page with products, pagination, and search term
        res.render('product-list', {
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            searchTerm,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.redirect('/pageerror');
    }
};



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
        console.log( req.files.length ,"this in sider try") 
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
        console.log("the conditon checked in try")
        // Directory where processed images will be saved
        const outputDir = path.join(__dirname, "../public/uploads/re-image");

        // Ensure the directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

       

          // Process the images
          const productImages = req.files.map(file => file.filename);

        // Create new product with processed images
        const newProduct = new Product({
            productName,
            description,
            brand,
            category,
            regularPrice,
            salePrice,
            weight,
            quantity,
            productImages // Save the processed image filenames
        });

        await newProduct.save();


        // Redirect to add product page after successful submission
        res.redirect('/admin/addProduct');
    } catch (error) {
        console.log(req.files , req.files.length ,"this in sider catch") 
        console.error('Error adding product:', error);
        res.redirect('/pageerror');
    }
};


// Get category data for editing
// Get product data for editing
const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Fetch the product data by ID
        const product = await Product.findById(productId).populate('category').populate('brand');
        
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Fetch all categories and brands for the dropdown lists
        const categories = await Category.find({});
        const brands = await Brand.find({});

        // Render the edit product page with product, categories, and brands data
        res.render('editProduct', { product, categories, brands });
    } catch (error) {
        console.error('Error fetching product for editing:', error);
        res.status(500).send('Error fetching product for editing');
    }
};


// Handle category update
const postEditProduct = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description, status } = req.body;
        await Category.findByIdAndUpdate(categoryId, { name, description, status });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).send('Error updating category');
    }
};


module.exports = {
    getProductAddPage,
    postAddProduct,
    getProducts,
    getEditProduct
};


