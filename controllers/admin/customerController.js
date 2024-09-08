const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const customerInfo = async (req,res)=>{
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const sort = req.query.sort || 'newest';
        const usersPerPage = 3;

        // Fetch users based on search and sort logic
     // Query to filter out admin users and search by name
     const query = { 
        name: new RegExp(search, 'i'), 
        isAdmin: false 
    };
    const sortCriteria = sort === 'newest' ? { createdAt: -1 } : { createdAt: 1 }; // example sorting by createdAt

   

    const users = await User.find(query)
    .sort(sortCriteria)
    .skip((page - 1) * usersPerPage)
    .limit(usersPerPage);

    const totalUsers = await User.countDocuments(query);
    const totalpages = Math.ceil(totalUsers / usersPerPage);
        res.render('customers',{
            data: users, 
            totalpages, 
            currentPage: page,
            search,
            sort });

    } catch (error) {
        console.error("Admin custmers list controller ERROR  error",error);
        res.status(500).send("Server error");
    }
}
 





module.exports = {
    customerInfo
}