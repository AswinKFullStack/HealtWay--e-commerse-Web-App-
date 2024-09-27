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
const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 3;
        const searchTerm = req.query.search || '';

        let query = {};
        if (searchTerm) {
            query = {
                "productDetails.productName": { $regex: searchTerm, $options: 'i' },
            };
        }

        const ordersDetailList = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $lookup: {
                    from: "addresses",
                    let: { addressId: "$address", userId: "$userId" },
                    pipeline: [
                        { $match: { $expr: { $and: [ { $eq: ["$userId", "$$userId"] }, { $in: ["$$addressId", "$address._id"] } ] } } },
                        { $unwind: "$address" },
                        { $match: { $expr: { $eq: ["$address._id", "$$addressId"] } } },
                        { $replaceRoot: { newRoot: "$address" } }
                    ],
                    as: "deliveryAddress"
                }
            },
            {
                $unwind: "$orderedItems" 
            },
            {
                $lookup: {
                    from: "products",
                    localField: "orderedItems.productId",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { 
                $match: query 
            }
        ]);

        const sortedOrdersDetailList = ordersDetailList.sort((a, b) => {
            const dateA = a.orderedItems.createdAt ? new Date(a.orderedItems.createdAt) : a.orderedItems._id.getTimestamp();
            const dateB = b.orderedItems.createdAt ? new Date(b.orderedItems.createdAt) : b.orderedItems._id.getTimestamp();
            return dateB - dateA;
        });

        const totalOrders = ordersDetailList.length;
        const totalPages = Math.ceil(totalOrders / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages));
        const paginatedOrders = sortedOrdersDetailList.slice((currentPage - 1) * limit, currentPage * limit);
        console.log(paginatedOrders[0]);

        return res.status(200).send("Order fetched successfully");
    } catch (error) {
        console.error('Error fetching orders:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while fetching orders.", '/admin/orders');
    }
};



module.exports ={
    getOrders
}