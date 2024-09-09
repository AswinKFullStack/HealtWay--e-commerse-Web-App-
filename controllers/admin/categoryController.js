
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const mongoose = require("mongoose");



const categoryInfo = async (req,res)=>{
    try {
        
        const searchTerm = req.query.search || ''; // Search term from query string
        const currentPage = Math.max(1,parseInt(req.query.page)); // Current page number from query string
        const itemsPerPage = 3; // Number of categories per page

        // Filter categories by search term (case-insensitive)
        const searchQuery = searchTerm
            ? { name: { $regex: new RegExp(searchTerm, 'i') } }
            : {};

        // Count total categories for pagination
        const totalCategories = await Category.countDocuments(searchQuery);

        // Fetch the categories for the current page
        const categories = await Category.find(searchQuery)
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // Calculate total pages
        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        // Render the category management page with fetched data
        res.render('categories', {
            data: categories,
            totalpages: totalPages,
            currentPage: currentPage,
            searchTerm: searchTerm // Pass this for prefilling the search box
        });



       
          
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error when category Listing');
    }
}



// Add offer to a category
const addCategoryOffer = async (req, res) => {
    const categoryId = req.params.id;
    const offerPrice = parseFloat(req.body.offerPrice); // Convert to number

    if (!offerPrice || offerPrice <= 0) {
        return res.status(400).send('Invalid offer price');
    }

    try {
        // Update the category with the new offer price
        await Category.findByIdAndUpdate(categoryId, { offerPrice: offerPrice });

        // Fetch all products in this category
        const products = await Product.find({ category: categoryId });

        // Update each product's salePrice based on the offer
        for (const product of products) {
            const discountedPrice = product.regularPrice - (product.regularPrice * offerPrice / 100);
            await Product.findByIdAndUpdate(product._id, { salePrice: discountedPrice });
        }

        res.redirect(`/admin/categories?page=${req.query.page || 1}`);
    } catch (error) {
        console.error('Error when adding category offer:', error);
        res.status(500).send('Error when adding category offer');
    }
};


// Remove offer from a category
const removeCategoryOffer = async (req, res) => {
    const categoryId = req.params.id;

    try {
        // Remove the offer from the category
        await Category.findByIdAndUpdate(categoryId, { $unset: { offerPrice: 1 } });

        // Fetch all products in this category
        const products = await Product.find({ category: categoryId });

        // Revert the salePrice of each product to its regularPrice
        for (const product of products) {
            await Product.findByIdAndUpdate(product._id, { salePrice: product.regularPrice });
        }

        res.redirect(`/admin/categories?page=${req.query.page || 1}`);
    } catch (error) {
        console.error('Error when removing category offer:', error);
        res.status(500).send('Error when removing category offer');
    }
};



// Render add category form
const getAddCategory = (req, res) => {
    res.render('addCategory');
};

// Handle adding new category
const postAddCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const newCategory = new Category({ name, description });
        await newCategory.save();
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error adding new category:', error);
        res.status(500).send('Error adding new category');
    }
};


// Get category data for editing
const getEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('editCategory', { category });
    } catch (error) {
        console.error('Error fetching category for editing:', error);
        res.status(500).send('Error fetching category for editing');
    }
};

// Handle category update
const postEditCategory = async (req, res) => {
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

// Delete category controller function
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        await Category.findByIdAndDelete(categoryId);
        res.redirect('/admin/categories');// Redirect to the category list page after deletion
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).send('Error deleting category');
    }
};

// View single category details
const viewCategoryDetails = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).send('Category not found');
        }
        res.render('categoryDetails', { category });
    } catch (error) {
        console.error('Error fetching category details:', error);
        res.status(500).send('Error fetching category details');
    }
};



module.exports = {
    categoryInfo,
    addCategoryOffer,
    removeCategoryOffer,
    getAddCategory,
    postAddCategory,
    getEditCategory,
    postEditCategory,
    deleteCategory,
    viewCategoryDetails

};