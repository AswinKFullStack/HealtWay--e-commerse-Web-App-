const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");


//login management
const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render("login");
        }else{
            res.redirect("/");
        }
    } catch (error) {
        res.redirect("/pageNotFound")
    }
}

const login = async (req,res)=>{
    try {
        console.log("inside try");
        const {email,password} = req.body;
        console.log("email ",email);
        console.log("password ",password)
        const findUser = await User.findOne({isAdmin:false,email:email})
        if(!findUser){
            
            console.log("user not finding");
            return res.render("login",{message:"User not found"})
        }if(findUser.isBlocked){
            console.log("is blokect");
            return res.render("login",{message:"User is blocked by admin"})
        }
        const passwordMatch = await bcrypt.compare(password,findUser.password);
        if(!passwordMatch){
            console.log("password not matching");
            return res.render("login",{message:"Incorret Password"})
        }
        req.session.user=findUser._id;
        res.redirect("/");
        console.log("User login successfull with  req.session.user =",req.session.user)
    } catch (error) {
        console.error("Login error",error)
        console.log("inside catch");
        res.render("Login",{message:"Login failed .Please try again later"})  
    }
}



//logout user

const logout = async (req,res)=>{
    try {
        req.session.destroy((error)=>{
            if(error){
                console.log("Session destruction error",error);
                return res.redirect("/pageNotFound");
            }
            return res.redirect("/login");
        })
    } catch (error) {
        console.error("Logout error(catch) ",error); 
        return res.redirect("/pageNotFound");  
    }
}












module.exports = {
    loadLogin,
    login,
    logout
}