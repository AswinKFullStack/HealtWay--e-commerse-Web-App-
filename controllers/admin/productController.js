
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const fs = require("fs");
const sharp = require('sharp');
const path = require("path");

// Function to handle rendering an error page with details
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render("admin-error-page", {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Loading Products list
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const searchTerm = req.query.search || '';

        let query = { isDeleted: false };
        if (searchTerm) {
            query = {
                productName: { $regex: searchTerm, $options: 'i' },
                isDeleted: false
            };
        }

        const totalProducts = await Product.countDocuments(query);
        const products = await Product.find(query)
            .populate('category')
            .populate('brand')
            .skip((page - 1) * limit)
            .limit(limit);

        res.render('product-list', {
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            searchTerm,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching products.", '/admin/products');
    }
};

const getProductAddPage = async (req, res) => {
    try {
        const categories = await Category.find({ status: "Listed" });
        const brands = await Brand.find({ isBlocked: false });

        res.render("product-add", { categories, brands });
    } catch (error) {
        console.error('Error loading product add page:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while loading the product add page.", '/admin/products');
    }
};

const postAddProduct = async (req, res) => {
    try {
        if (!req.files || req.files.length < 3) {
            return res.status(400).send('Please upload at least three images.');
        }

        const { productName, description, brand, category, regularPrice, salePrice, weight, quantity } = req.body;

        if (!productName || !description || !brand || !category || !regularPrice || !salePrice || !quantity) {
            return res.status(400).send('All fields are required.');
        }

        const outputDir = path.join(__dirname, "../public/uploads/re-image");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const productImages = req.files.map(file => file.filename);

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
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error adding product:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while adding the product.", '/admin/products');
    }
};

const getEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('category').populate('brand');
        
        if (!product) {
            return renderErrorPage(res, 404, "Product Not Found", "The product you are trying to edit does not exist.", '/admin/products');
        }

        const categories = await Category.find({});
        const brands = await Brand.find({});
        res.render('editProduct', { product, categories, brands });
    } catch (error) {
        console.error('Error fetching product for editing:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching the product for editing.", '/admin/products');
    }
};

const postEditProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return renderErrorPage(res, 404, "Product Not Found", "The product you are trying to update does not exist.", '/admin/products');
        }

        const { productName, description, brand, category, regularPrice, salePrice, weight, quantity } = req.body;

        if (!productName || !description || !brand || !category || !regularPrice || !salePrice || !quantity) {
            return res.status(400).send('All fields are required.');
        }

        if (req.body.imagesToDelete) {
            const imagesToDelete = Array.isArray(req.body.imagesToDelete) ? req.body.imagesToDelete : [req.body.imagesToDelete];
            
            imagesToDelete.forEach(imageName => {
                const imagePath = path.join(__dirname, "../public/uploads/re-image", imageName);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
                const index = product.productImages.indexOf(imageName);
                if (index > -1) {
                    product.productImages.splice(index, 1);
                }
            });
        }

        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.filename);
            product.productImages.push(...newImages);
        }

        if (product.productImages.length < 3) {
            return res.status(400).send('Please ensure there are at least three images in total.');
        }

        product.productName = productName;
        product.description = description;
        product.brand = brand;
        product.category = category;
        product.regularPrice = regularPrice;
        product.salePrice = salePrice;
        product.weight = weight;
        product.quantity = quantity;

        await product.save();
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error editing product:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while editing the product.", '/admin/products');
    }
};

const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId)
            .populate('brand', 'brandName')
            .populate('category', 'name')
            .exec();

        if (!product) {
            return renderErrorPage(res, 404, "Product Not Found", "The product you are trying to view does not exist.", '/admin/products');
        }

        res.render('productView', { product });
    } catch (error) {
        console.error('Error fetching product details:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching product details.", '/admin/products');
    }
};

const softDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findByIdAndUpdate(productId, { isDeleted: true }, { new: true });

        if (!product) {
            return renderErrorPage(res, 404, "Product Not Found", "The product you are trying to delete does not exist.", '/admin/products');
        }

        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while deleting the product.", '/admin/products');
    }
};

const unblockProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        await Product.findByIdAndUpdate(productId, { isBlocked: false });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error unblocking product:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while unblocking the product.", '/admin/products');
    }
};

const blockProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        await Product.findByIdAndUpdate(productId, { isBlocked: true });
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error blocking product:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while blocking the product.", '/admin/products');
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




