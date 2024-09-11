const Brand = require("../../models/brandSchema");
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

// Load the Brand Management Page
const getBrandpage = async (req, res) => {
  try {
    const searchTerm = req.query.search || ""; // Search term from query string
    const currentPage = Math.max(1, parseInt(req.query.page) || 1); // Current page number from query string
    const itemsPerPage = 3; // Number of brands per page

    // Filter brands by search term (case-insensitive)
    const searchQuery = {
      ...(searchTerm ? { brandName: { $regex: new RegExp(searchTerm, "i") } } : {})
    };

    // Count total brands for pagination
    const totalBrands = await Brand.countDocuments(searchQuery);

    // Fetch the brands for the current page
    const brands = await Brand.find(searchQuery)
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage);

    // Calculate total pages
    const totalPages = Math.ceil(totalBrands / itemsPerPage);

    // Render the brand management page with fetched data
    res.render("brands", {
      data: brands,
      totalPages,
      currentPage,
      searchTerm
    });
  } catch (error) {
    console.error("Error fetching brand page:", error);
    renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while loading the brand page.", '/admin/brands');
  }
};

// Render the Add Brand Page
const getAddBrand = (req, res) => {
  res.render("addNewBrand", { errorMessage: null });
};

// Handle Adding a New Brand
const postAddBrand = async (req, res) => {
  try {
    if (!req.file || !req.body.brandName) {
      return res.render("addNewBrand", { errorMessage: "Both brand name and image are required." });
    }

    const { brandName } = req.body;
    const brandImage = req.file.filename;

    // Validate brand data
    if (!brandName.trim()) {
      return res.render("addNewBrand", { errorMessage: "Brand name cannot be empty." });
    }

    // Save the new brand to the database
    const newBrand = new Brand({
      brandName,
      brandImage: [brandImage]
    });

    await newBrand.save();
    res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error adding new brand:", error);
    renderErrorPage(res, 500, "Server Error", "Failed to add brand. Please try again.", '/admin/brands');
  }
};

// Handle Blocking a Brand
const blockBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    await Brand.findByIdAndUpdate(brandId, { isBlocked: true });
    res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error blocking brand:", error);
    renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while blocking the brand.", '/admin/brands');
  }
};

// Handle Unblocking a Brand
const unblockBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    await Brand.findByIdAndUpdate(brandId, { isBlocked: false });
    res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error unblocking brand:", error);
    renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while unblocking the brand.", '/admin/brands');
  }
};

// Handle Deleting a Brand
const deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    await Brand.findByIdAndDelete(brandId);
    res.redirect("/admin/brands");
  } catch (error) {
    console.error("Error deleting brand:", error);
    renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while deleting the brand.", '/admin/brands');
  }
};

module.exports = {
  getBrandpage,
  getAddBrand,
  postAddBrand,
  blockBrand,
  unblockBrand,
  deleteBrand
};

