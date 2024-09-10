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
        let query = {isDeleted: false};
        if (searchTerm) {
            query = {
                productName: { $regex: searchTerm, $options: 'i' },
                 isDeleted: false // case-insensitive search
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


// Handle  product update

const postEditProduct = async (req, res) => {
    try {
        const productId = req.params.id; // Get the product ID from the URL parameters

        // Fetch the existing product from the database
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Extract data from the request body
        const { productName, description, brand, category, regularPrice, salePrice, weight, quantity } = req.body;
        console.log(req.body);
        console.log( 'productName=',productName, 'description=',description,'brand=', brand, 'category=',category, 'regularPrice=',regularPrice, 'salePrice=',salePrice,'weight=', weight, 'quantity=',quantity)
        // Server-side validation for required field
        if (!productName || !description || !brand || !category || !regularPrice || !salePrice || !quantity) {
            return res.status(400).send('All fields are required.');
        }

        // Handle deletion of images if any
        if (req.body.imagesToDelete) {
            const imagesToDelete = Array.isArray(req.body.imagesToDelete) ? req.body.imagesToDelete : [req.body.imagesToDelete];
            
            imagesToDelete.forEach(imageName => {
                const imagePath = path.join(__dirname, "../public/uploads/re-image", imageName);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath); // Delete the image file from the 're-image' directory
                }
                // Remove the image from the product's image array
                const index = product.productImages.indexOf(imageName);
                if (index > -1) {
                    product.productImages.splice(index, 1);
                }
            });
        }

        // Process new images uploaded
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            product.productImages.push(...newImages); // Add new images to the existing list
        }

        // Ensure there are at least 3 images in total
        if (product.productImages.length < 3) {
            return res.status(400).send('Please ensure there are at least three images in total.');
        }

        // Update the product with new data
        product.productName = productName;
        product.description = description;
        product.brand = brand;
        product.category = category;
        product.regularPrice = regularPrice;
        product.salePrice = salePrice;
        product.weight = weight;
        product.quantity = quantity;

        // Save the updated product to the database
        await product.save();

        // Redirect to the product list or another appropriate page
        res.redirect('/admin/products'); // Adjust the redirect path as needed
    } catch (error) {
        console.error('Error editing product:', error);
        res.redirect('/pageerror');
    }
};


const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id; // Get product ID from URL parameters

        // Fetch the product details from the database
        const product = await Product.findById(productId)
            .populate('brand', 'brandName') // Populate brand data
            .populate('category', 'name') // Populate category data
            .exec();

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Render the product details view page
        res.render('productView', { product });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.redirect('/pageerror');
    }
};


const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Find the product by ID and update the isDeleted field to true
        const product = await Product.findByIdAndUpdate(
            productId,
            { isDeleted: true },
            { new: true }
        );

        if (!product) {
            return res.status(404).send('Product not found.');
        }

        // Redirect back to the product list page with a success message
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('An error occurred while deleting the product.');
    }
};



//this is for restore the deleted product

// const restoreProduct = async (req, res) => {
//     try {
//         const productId = req.params.id;

//         const product = await Product.findByIdAndUpdate(
//             productId,
//             { isDeleted: false },
//             { new: true }
//         );

//         if (!product) {
//             return res.status(404).send('Product not found.');
//         }

//         res.redirect('/admin/products');
//     } catch (error) {
//         console.error('Error restoring product:', error);
//         res.status(500).send('An error occurred while restoring the product.');
//     }
// };


const unblockProduct = async (req, res) => {
    const productId = req.params.id;
    try {
      await Product.findByIdAndUpdate(productId, { isBlocked: false });
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Error listing products:', error);
      res.status(500).send('Error listing products');
    }
};
  
  // Change category status to 'Unlisted'
const blockProduct = async (req, res) => {
    const productId = req.params.id;
    try {
      await Product.findByIdAndUpdate(productId, { isBlocked: true });
      res.redirect('/admin/products');
    } catch (error) {
      console.error('Error listing products:', error);
      res.status(500).send('Error listing products');
    }
};






module.exports = {
    getProductAddPage,
    postAddProduct,
    getProducts,
    getEditProduct,
    postEditProduct,
    getProductDetails,
    softDeleteProduct,
    blockProduct,
    unblockProduct
};


