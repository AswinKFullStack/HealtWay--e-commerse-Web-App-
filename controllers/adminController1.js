const User = require("../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const loadLogin = async (req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin/dashboard");
        }
        res.render("admin-login");
    } catch (error) {
        console.error("Admin Login page error",error);
        res.status(500).send("Server error");
    }
    
}


module.exports = {
    loadLogin
}