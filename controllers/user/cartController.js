const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const mongoose = require('mongoose');
const { parse } = require("dotenv");


const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};




const addCart = async (req,res) => {
    try {
        const user = await User.findById(req.session.user);
        const cartItemQuantity = parseInt(req.query.quantity, 10) || 1;
        const currentPage = req.query.page;
        
        if(!user){
            return res.status(404).send('User not found.'); 
        }

        const productId = req.params.productId;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const message = "Invalid Product ID.";
            
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }


        const product = await Product.findById(productId);
        console.log("New Product for Cart status = " ,product.status);
        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;

        if(product.status !== "Available"){
            console.log("Product status is not Available =" ,product.status);
            const message = `This Product is ${product.status}` ;
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }
        console.log("Number of quantity product = ",product.quantity );
        if(product.quantity<1){
            console.log("Product stock count  is too small = ",product.quantity)
            const message = "Product not in stock";
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }

        const newCartItem = {
            productId :product._id,
            price : product.salePrice,
            quantity:cartItemQuantity,

        } 
        let cartDoc = await Cart.findOne({userId:user._id});
    if(cartDoc){
        console.log("User already have cart Documet in this  collection .Number items in the cart =",cartDoc.items.length)
        const existingCartItem = cartDoc.items.find(item => item.productId.toString() === productId);
        
        if(existingCartItem){
            console.log("User already added this product into cart collection .This product Quantity in items-Array before updating ", existingCartItem.quantity)
            if(cartItemQuantity >userBuyLimitInQuantity){
                const message = `We are Sorry only ${userBuyLimitInQuantity} unit(s) allowed in each order of this product(${product.productName})` ;
                return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
                const cartUpdateResult = await Cart.updateOne(
                    { userId:user._id, 'items._id': existingCartItem._id }, // Match the user and the specific address
                    {
                        $set: {
                            'items.$.price': product.salePrice,
                            'items.$.quantity': cartItemQuantity,
                            'items.$.totalPrice': product.salePrice * cartItemQuantity ,
                            }
                        }
                    );

                    console.log('Existing Cart item Quantity Update Result:', cartUpdateResult);
                    
                    if (cartUpdateResult.matchedCount === 0) {
                        const message = "cart not found.";
                        return res.status(404).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
                        
                    }
            
                    if (cartUpdateResult.modifiedCount === 0) {
                        const message = "No changes were made to the Cart.";
                        return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
                        
                    }
                    await cartDoc.updateTotal();
                    // Successful update
                    const successMessage = `We are added ${cartItemQuantity} unit(s) in cart of this product(${product.productName})`;
                    return res.redirect(`/cartView?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
            }
        }else{
            console.log("User going to push the new product in the cart document ");
                cartDoc.items.push(newCartItem);
        }
            
    }else{
        console.log("User first time adding a  product in cart")
            cartDoc = new Cart({
              userId:user._id,
              items:[newCartItem]  
            })
        }
        await cartDoc.updateTotal();

        await cartDoc.save();
        //const message = "Poduct addedd successfullly!"
        //res.redirect(`/cartView?message=${encodeURIComponent(message)}`);

        const message = "This product added in your cart";
        return res.status(200).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);

    } catch (error) {
        console.error("Error in addCat - method = ",error);

    const backLink = req.headers.referer || `/product/addCart/${req.params.productId}`;
    renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while product adding to cart", backLink);
    }
}


const LoadCartPage = async (req,res) => {
    try {
        res.render('cartView',{
            title: 'Cart management',});
    } catch (error) {
        
    }
}

module.exports = {
    addCart,
    LoadCartPage
}