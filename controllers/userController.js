const User = require("../models/userSchema");



const pageNotFound = async (req,res)=>{
    try{
        res.render("page-404");
    }catch(error){
        res.redirect("/pageNotFound");
    }
}

const loadHomepage = async (req,res)=>{
    try{
        return res.render("home");
    }catch(error){
        console.log("Home page not found");
        res.status(500).send("Server error");
    }
}

const loadSignup = async(req,res)=>{
    try{
        return res.render("signup");
    }catch(error){
        console.log("Login page is not found",error);
        res.status(500).send("Server error");
    }
}
function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString;
}


const signup = async (req,res)=>{
    try{
        const {name,email,phone,password,confirmPassword} = req.body;
        if(password !== confirmPassword){
            return res.render("signup",{message:"Password do not match"});
        }
        const findUser = await User.findOne({email});
        if(findUser){
            return res.render("signup",{message:"User with email already exists"});
        }
        const otp = generateOtp();

    }catch(error){
        console.log("Erro for save user",error);
        res.status(500).send('Internal server error');
    }
}

module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup
}