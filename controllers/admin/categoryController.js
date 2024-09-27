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
        const searchTerm = req.query.search || ""; 
        const currentPage = Math.max(1, parseInt(req.query.page) || 1); 
        const itemsPerPage = 3;

        const searchQuery = {
            ...((searchTerm && { name: { $regex: new RegExp(searchTerm, "i") } }) || {}),
            isDeleted: false, 
        };

        const totalCategories = await Category.countDocuments(searchQuery);

        const categories = await Category.find(searchQuery)
            .sort({ createdAt: -1 }) 
            .skip((currentPage - 1) * itemsPerPage)
            .limit(itemsPerPage);

        const totalPages = Math.ceil(totalCategories / itemsPerPage);

        res.render("categories", {
            data: categories,
            totalpages: totalPages,
            currentPage: currentPage,
            searchTerm: searchTerm, 
        });
    } catch (error) {
        console.error("Error fetching category information:", error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while listing categories.", '/admin/categories');
    }
};

// Add offer to a category
const addCategoryOffer = async (req, res) => {
    const categoryId = req.params.id;
    const offerPrice = parseFloat(req.body.offerPrice); 

    if (!offerPrice || offerPrice <= 0) {
        return res.status(400).send('Invalid offer price');
    }

    try {
        await Category.findByIdAndUpdate(categoryId, { offerPrice: offerPrice });

        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            let finalDiscount = offerPrice; 

            
            if (product.productOffer > 0) {
                finalDiscount = Math.max(offerPrice, product.productOffer);
            }

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
        await Category.findByIdAndUpdate(categoryId, { $unset: { offerPrice: 1 } });

        const products = await Product.find({ category: categoryId });

        for (const product of products) {
            let finalPrice = product.regularPrice; 

            if (product.productOffer > 0) {
                finalPrice = product.regularPrice - (product.regularPrice * product.productOffer / 100);
            }

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
// const deleteCategory = async (req, res) => {
//     try {
//         const categoryId = req.params.id;

//         await Category.findByIdAndUpdate(categoryId, { isDeleted: true });

//         res.redirect("/admin/categories");
//     } catch (error) {
//         console.error("Error soft deleting category:", error);
//         renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while soft deleting the category.", '/admin/categories');
//     }
// };

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
    // deleteCategory,
    viewCategoryDetails,
    listCategory,
    unlistCategory
};
