const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");



const getProductAddPage = async (req,res)=>{
    try {
        if(req.session.admin){
            return res.render("product-add");
        }else {
            // If the admin session does not exist, redirect to the admin login page
            return res.redirect("/admin/login");
        }
        
    } catch (error) {
        return res.redirect("/pageerror")
    }
}


module.exports = {

    getProductAddPage
}

