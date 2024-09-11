const User = require("../models/userSchema");


//User authentication
const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                console.log("authentication success");
                
                next();
            }else{
                console.log("Authentication failed");
                res.redirect("/login");
            }
        }).catch(error =>{
            console.log("Error in user Authentication middleware ");
            res.status(500).send("Internal Server error")
            
        })
    }else{
        console.log("session not found");
                res.redirect("/login");
    }
}


//admin authentication

const adminAuth = (req,res,next)=>{
    if(req.session.admin){
        User.findOne({isAdmin:true,_id:req.session.admin})
        .then(data=>{
            if(data){
                console.log("Admin authentication success");
                
                next();
            }else{
                console.log("Admin Authentication failed");
                res.redirect("/admin/login");
            }
        }).catch(error =>{
            console.log("Error in Admin Authentication middleware ");
            res.status(500).send("Internal Server error")
            
        })
    }else {
        res.status(403).render('admin-error-page', {
            errorCode: 403,
            errorMessage: "Forbidden",
            errorDescription: "You don't have permission to access this page."
        });
    }

}

module.exports = {
    userAuth,
    adminAuth  
}