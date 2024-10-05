const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Order = require("../../models/orderSchema");

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
const getAllOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const skip = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        let query = {};
        if (searchTerm) {
            query = {
                "productDetails.productName": { $regex: searchTerm, $options: 'i' },
            };
        }

        const [orders, totalOrders] = await Promise.all([
            Order.find()
              .populate('userId', 'name') // Fetch user name (Assuming 'name' is a field in User schema)
              .skip(skip)
              .limit(limit)
              .sort({ updatedAt :-1}),
            Order.countDocuments()
          ]);


      

        const totalPages = Math.ceil(totalOrders / limit);
       
        


        res.render('orders', {
            
            
            orders,
            currentPage: page,
            totalPages,
            searchTerm

        });

        
    } catch (error) {
        console.error('Error fetching orders:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching orders.", '/admin/orders');
    }
};


const updateOrderStatus = async (req,res) => {
    try {
        
        const { orderId } = req.params;
        const { status } = req.body;

       

        await Order.findByIdAndUpdate(orderId, { orderStatus: status });
        

            

        //  if(updatedResult.modifiedCount === 0){
        //     return res.status(500).json({ success: false, message: 'Error updating status' });
        //  }   
         return res.status(200).json({ success: true, message: 'Status updated successfully' });
    } catch (error) {
        
    }
}



module.exports ={
    getAllOrders,
    updateOrderStatus
}