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
        const cartItemQuantity = parseInt(req.body.quantity, 10) || 1;
        const currentPage = req.query.page || 1;
        
        if(!user){
            return res.status(404).send('User not found.'); 
        }

        const productId = req.params.productId;
        console.log("Searching for product with ID:", productId);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            const message = "Invalid Product ID.";
            
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }


        const product = await Product.findOne({ _id: productId, isDeleted: false });

        if (!product) {
            console.error("Product not found or marked as deleted with ID:", productId);
            const message = `Product not found or has been deleted.`;
            return res.status(404).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }
        

        console.log(product);
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
                    await cartDoc.save();
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
        const message = `The Poduct ${product.productName} addedd successfully!`
        return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}`);


    } catch (error) {
    console.error("Error in addCat - method(product adding IN cart ) = ",error);
    const backLink = req.headers.referer || `/product/addCart/${req.params.productId}`;
    renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while product adding  to cart", backLink);
    }
}



////// Loading the cart page 

const LoadCartPage = async (req,res) => {
    try {
        const { message = null, page = 1, limit = 3 } = req.query;

        const user = await User.findById(req.session.user);
        if(!user){
            const backLink = req.headers.referer || '/';
            return  renderErrorPage(res, 404, "User not find", "User need to login", backLink);
        }


        const cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            console.log("User doesn't have products in the cart");
            const message = "Your cart is empty.";
            return res.render('cartView', {
                title: 'Cart Management',
                cart: null,  
                message,
                currentPage: 1,
                totalPages: 1
            });
        }

        // Sort the cart items by their creation date in descending order (latest first)
        cart.items.sort((a, b) => b.createdAt - a.createdAt);

        // Pagination logic
        const totalItems = cart.items.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.max(1, Math.min(page, totalPages)); // Ensure current page is within bounds


        // Calculate the items to display on the current page
        const paginatedItems = cart.items.slice((currentPage - 1) * limit, currentPage * limit);

        res.render('cartView', {
            title: 'Cart Management',
            cart: {
                items: paginatedItems,
                totalCartPrice: cart.totalCartPrice // Assuming you have this field in your cart schema
            },
            message,
            currentPage,
            totalPages
        });

    } catch (error) {
        
        console.error("Error in LoadCartPage:", error);
        const backLink = req.headers.referer || '/';
        renderErrorPage(res, 500, "Internal Server Error", "An error occurred while loading the cart page", backLink);
    }
}


const cartUpdate = async (req,res) => {
    try {
        const user = await User.findById(req.session.user);
        const cartItemNewQuantity = parseInt(req.body.quantity, 10) || 1;
        const currentPage = req.query.page || 1;
        if(!user){
            return res.status(404).send('User not found.'); 
        }

        const {productId ,cartItemId} = req.params;
        console.log("Searching for product with ID:", productId);
        console.log("Searching for cart item  with ID:", cartItemId);

        if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(cartItemId) ) {
            const message = "Invalid Product ID. or cart ID";
            
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }


        const product = await Product.findOne({ _id: productId, isDeleted: false });
        

        if (!product) {
            console.error("Product not found or marked as deleted with ID:", productId);
            const message = `Product not found or has been deleted.`;
            return res.status(404).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }
        

        console.log(product);
        console.log(" Product  status = " ,product.status);
        const userBuyLimitInQuantity = product.userBuyLimitInQuantity || 10;

        
        console.log("Number of quantity product = ",product.quantity );

        const newCartItem = {
            productId :product._id,
            price : product.salePrice,
            quantity:cartItemNewQuantity,

        } 

       
        let cartDoc = await Cart.findOne({userId:user._id});
    if(cartDoc){
        console.log("User already have cart Documet in this  collection .Number items in the cart =",cartDoc.items.length)
        const existingCartItem =  await Cart.findOne({userId:user._id, "items._id":cartItemId});
        
        if(existingCartItem){

            console.log("This product Quantity in items-Array before updating ", existingCartItem.quantity)
            //checking product stock out or not
            if(product.quantity<1){
                console.log("Product stock count  is too small = ",product.quantity)
                const message = "Product not in stock";
                const cartUpdateResult = await Cart.updateOne(
                    { userId:user._id, 'items._id': existingCartItem._id }, // Match the user and the specific address
                    {
                        $set: {
                            'items.$.price': product.salePrice,
                            'items.$.quantity': 0,
                            'items.$.totalPrice': 0 ,
                            }
                        }
                    );

                await cartUpdateResult.updateTotal();

                await cartUpdateResult.save();
                
                return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }
            if(cartItemNewQuantity < 1){
                console.log("User updation Quantity is too 0 or negative number = ",product.quantity)
                const message = `Updating Quntity cart Item ${product.productName} is too small -not modified `;
                

                
                
                return res.redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }

            if(product.status !== "Available"){
                console.log("Product status is not Available =" ,product.status);
                const message = `This Product is ${product.status}` ;
                
                const cartUpdateResult = await Cart.updateOne(
                    { userId:user._id, 'items._id': existingCartItem._id }, // Match the user and the specific address
                    {
                        $set: {
                            'items.$.price': product.salePrice,
                            'items.$.quantity': 0,
                            'items.$.totalPrice': 0 ,
                            }
                        }
                    );

                await cartUpdateResult.updateTotal();

                await cartUpdateResult.save();
                
                return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
                
            }

            if(cartItemNewQuantity >userBuyLimitInQuantity){
                const message = `We are Sorry ,only ${userBuyLimitInQuantity} unit(s) allowed in each order of this product - ${product.productName}` ;
                return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}&page=${currentPage}`);
            }else{
                const cartUpdateResult = await Cart.updateOne(
                    { userId:user._id, 'items._id': existingCartItem._id }, // Match the user and the specific address
                    {
                        $set: {
                            'items.$.price': product.salePrice,
                            'items.$.quantity': cartItemNewQuantity,
                            'items.$.totalPrice': product.salePrice * cartItemNewQuantity ,
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
                    
                    await cartUpdateResult.updateTotal();

                    await cartUpdateResult.save();
                    // Successful update
                    const successMessage = `We are added ${cartItemQuantity} unit(s) in cart of this product(${product.productName})`;
                    return res.redirect(`/cartView?message=${encodeURIComponent(successMessage)}&page=${currentPage}`);
            }
        }else{
            console.log("User going to push the new product in the cart document ");
                cartDoc.items.push(newCartItem);
                await cartDoc.updateTotal();

                await cartDoc.save();
                const message = `The Poduct ${product.productName} addedd successfully!`
                return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }
            
    }else{
        if(product.quantity<1){
            console.log("Product stock count  is too small = ",product.quantity)
            const message = "Product not in stock";
            return res.status(400).redirect(`/product/view/${productId}?message=${encodeURIComponent(message)}`);
        }
        if(product.status !== "Available"){
            console.log("Product status is not Available =" ,product.status);
            const message = `This Product is ${product.status}` ;
            return res.status(400).redirect(`/cartView?message=${encodeURIComponent(message)}`);
        }
        console.log("User first time adding a  product in cart")
            cartDoc = new Cart({
              userId:user._id,
              items:[newCartItem]  
            })
        }
        await cartDoc.updateTotal();

        await cartDoc.save();
        const message = `The Poduct ${product.productName} addedd successfully!`
        return res.status(200).redirect(`/cartView?message=${encodeURIComponent(message)}`);

    } catch (error) {
        console.error("Error in cartUpdate - method( updating Quantity -IN cart ) = ",error);

        const backLink = req.headers.referer || `/cartView`;
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while product  updating Quantity to cart", backLink);
    }
}

module.exports = {
    addCart,
    LoadCartPage,
    cartUpdate
}