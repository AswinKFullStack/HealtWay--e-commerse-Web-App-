const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

// Function to handle rendering an error page with details
const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render("admin-error-page", {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

// Fetch and Render Category Information
const categoryInfo = async (req, res) => {
    try {
        const searchTerm = req.query.search || ""; // Search term from query string
        const currentPage = Math.max(1, parseInt(req.query.page) || 1); // Current page number with default as 1
        const itemsPerPage = 3; // Number of categories per page

        // Filter categories by search term (case-insensitive) and exclude deleted categories
        const searchQuery = {
            ...((searchTerm && { name: { $regex: new RegExp(searchTerm, "i") } }) || {}),
            isDeleted: false, // Exclude categories marked as deleted
        };

        // Count total categories for pagination
        const totalCategories = await Category.countDocuments(searchQuery);

        // Fetch the categories for the current page
        const categories = await Category.find(searchQuery)
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        // Calculate total pages
        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        // Render the category management page with fetched data
        res.render("categories", {
            data: categories,
            totalpages: totalPages,
            currentPage: currentPage,
            searchTerm: searchTerm, // Pass this for prefilling the search box
        });
    } catch (error) {
        console.error("Error fetching category information:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while listing categories.", '/admin/categories');
    }
};

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

        // Update each product's salePrice based on both category and product offer
        for (const product of products) {
            let finalDiscount = offerPrice; // Start with the category discount

            // If product-specific offer exists, combine the offers (or pick the greater offer)
            if (product.productOffer > 0) {
                // Example: Choose the greater of the two offers
                finalDiscount = Math.max(offerPrice, product.productOffer);
            }

            // Calculate the discounted price
            const discountedPrice = product.regularPrice - (product.regularPrice * finalDiscount / 100);
            await Product.findByIdAndUpdate(product._id, { salePrice: discountedPrice });
        }

        res.redirect(`/admin/categories?page=${req.query.page || 1}`);
    } catch (error) {
        console.error("Error adding category offer:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while adding the category offer.", '/admin/categories');
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

        // Revert the salePrice of each product based on their product-specific offer (if any)
        for (const product of products) {
            let finalPrice = product.regularPrice; // Default to regular price

            // If product has its own offer, calculate sale price based on product offer
            if (product.productOffer > 0) {
                finalPrice = product.regularPrice - (product.regularPrice * product.productOffer / 100);
            }

            // Update the sale price
            await Product.findByIdAndUpdate(product._id, { salePrice: finalPrice });
        }

        res.redirect(`/admin/categories?page=${req.query.page || 1}`);
    } catch (error) {
        console.error('Error removing category offer:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while removing the category offer.", '/admin/categories');
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
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while adding a new category.", '/admin/categories');
    }
};

// Get category data for editing
const getEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return renderErrorPage(res, 404, "Category Not Found", "The category you are trying to edit does not exist.", '/admin/categories');
        }
        res.render('editCategory', { category });
    } catch (error) {
        console.error('Error fetching category for editing:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching the category for editing.", '/admin/categories');
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
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while updating the category.", '/admin/categories');
    }
};

// Soft delete category controller function
const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Perform a soft delete by setting isDeleted to true
        await Category.findByIdAndUpdate(categoryId, { isDeleted: true });

        // Redirect to the category list page after soft deletion
        res.redirect("/admin/categories");
    } catch (error) {
        console.error("Error soft deleting category:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while soft deleting the category.", '/admin/categories');
    }
};

// View single category details
const viewCategoryDetails = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            return renderErrorPage(res, 404, "Category Not Found", "The category you are trying to view does not exist.", '/admin/categories');
        }
        res.render('categoryDetails', { category });
    } catch (error) {
        console.error('Error fetching category details:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching category details.", '/admin/categories');
    }
};

// Change category status to 'Listed'
const listCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        await Category.findByIdAndUpdate(categoryId, { status: 'Listed' });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error listing category:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while listing the category.", '/admin/categories');
    }
};

// Change category status to 'Unlisted'
const unlistCategory = async (req, res) => {
    const categoryId = req.params.id;
    try {
        await Category.findByIdAndUpdate(categoryId, { status: 'Unlisted' });
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error unlisting category:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while unlisting the category.", '/admin/categories');
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
    viewCategoryDetails,
    listCategory,
    unlistCategory
};
