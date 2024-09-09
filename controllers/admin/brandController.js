const Brand = require("../../models/brandSchema");
const Product = require("../../models/productSchema");

const getBrandpage = async(req,res)=>{
    try {
        const searchTerm = req.query.search || ""; // Search term from query string
        const currentPage = Math.max(1, parseInt(req.query.page)); // Current page number from query string
        const itemsPerPage = 3; // Number of categories per page
    
        // Filter categories by search term (case-insensitive) and exclude deleted categories
        const searchQuery = {
          ...((searchTerm && { name: { $regex: new RegExp(searchTerm, "i") } }) || {})
         
        };
    
        // Count total categories for pagination
        const totalCategories = await Brand.countDocuments(searchQuery);
    
        // Fetch the categories for the current page
        const brands = await Brand.find(searchQuery)
          .skip((currentPage - 1) * itemsPerPage)
          .limit(itemsPerPage);
    
        // Calculate total pages
        const totalPages = Math.ceil(totalCategories / itemsPerPage);
    
        // Render the category management page with fetched data
        res.render("brands", {
          data: brands,
          totalpages: totalPages,
          currentPage: currentPage,
          searchTerm: searchTerm, // Pass this for prefilling the search box
        });
      } catch (error) {
        console.error(error);
       res.redirect("/pageerror");
      }
}



const getAddBrand = async (req, res) => {
    try {
      // Render the add brand page
      res.render('addNewBrand', { errorMessage: null });
    } catch (error) {
      console.error(error);
      res.redirect('/pageerror');
    }
  };
  

  const postAddBrand = async (req, res) => {
    try {
      // Check if a file is uploaded and validate the brand name
      if (!req.file || !req.body.brandName) {
        return res.render('addnewbrand', { errorMessage: 'Both brand name and image are required' });
      }
  
      const { brandName } = req.body;
      const brandImage = req.file.filename; // Get the uploaded image filename
     
      // Save the new brand to the database
      const newBrand = new Brand({
        brandName,
        brandImage: [brandImage], // Store image filename in an array
      });
  
      await newBrand.save();
  
      res.redirect('/admin/brands'); // Redirect to brand management page after successful addition
    } catch (error) {
      console.error(error);
      res.render('addNewBrand', { errorMessage: 'Failed to add brand. Please try again.' });
    }
  };
  


module.exports ={
    getBrandpage,
    getAddBrand,
    postAddBrand
}