const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Review = require("../../models/reviewSchema");
const Cart = require("../../models/cartSchema");
const Address = require('../../models/addressSchema');
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

const checkoutLoad = async (req, res) => {
    try {
      const { addressPage = 1, addressLimit = 3, cartPage = 1, cartLimit = 10 } = req.query;
      
      // Fetch user information
      const user = await User.findById(req.session.user);
      if (!user) {
        throw new Error("User not found.");
      }
  
      let { cartMessage, addressMessage } = req.query;
  
      // Fetch user addresses
      let paginatedAddresses = [];
      let totalAddressPages = 1;
      let currentAddressPage = addressPage;
  
      try {
        const addressDoc = await Address.findOne({ userId: req.session.user }).select('address').lean();
        if (addressDoc && addressDoc.address.length > 0) {
          const sortedAddresses = addressDoc.address.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
            const dateB = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
            return dateB - dateA;
          });
  
          const totalAddresses = sortedAddresses.length;
          totalAddressPages = Math.ceil(totalAddresses / addressLimit);
          currentAddressPage = Math.max(1, Math.min(addressPage, totalAddressPages));
  
          const startIndex = (currentAddressPage - 1) * addressLimit;
          paginatedAddresses = sortedAddresses.slice(startIndex, startIndex + addressLimit);
        } else {
          addressMessage = "No addresses found.";
        }
      } catch (addressError) {
        console.error("Error fetching addresses:", addressError);
        addressMessage = "Error loading addresses.";
      }
  
      // Fetch user cart
      let cart;
      let paginatedCartItems = [];
      let totalCartPrice = 0;
      let totalCartPages = 1;
      let currentCartPage = cartPage;
  
      try {
        cart = await Cart.findOne({ userId: user._id }).populate('items.productId');
        if (cart && cart.items.length > 0) {
          for (let i = 0; i < cart.items.length; i++) {
            const item = cart.items[i];
  
            try {
              const product = await Product.findById(item.productId);
  
              if (!product || product.isDeleted || product.status !== "Available" || product.quantity === 0) {
                cart.items.splice(i, 1);  // Remove invalid item
                i--;  // Adjust index
                continue;
              }
  
              if (product.quantity < item.quantity) {
                item.quantity = product.quantity;
                item.totalPrice = product.salePrice * item.quantity;
              }
  
              totalCartPrice += item.totalPrice;
            } catch (productError) {
              console.error(`Error fetching product for item ${item.productId}:`, productError);
              cart.items.splice(i, 1);  // Remove item if there's an error with the product
              i--;
            }
          }
  
          // Update cart total price
          cart.totalCartPrice = totalCartPrice;
          await cart.save();
  
          const totalCartItems = cart.items.length;
          totalCartPages = Math.ceil(totalCartItems / cartLimit);
          currentCartPage = Math.max(1, Math.min(cartPage, totalCartPages));
  
          paginatedCartItems = cart.items.slice((currentCartPage - 1) * cartLimit, currentCartPage * cartLimit);
        } else {
          cartMessage = "Your cart is empty.";
          cart = { items: [], totalCartPrice: 0 };  // Default cart if no items
        }
      } catch (cartError) {
        console.error("Error fetching cart:", cartError);
        cartMessage = "Error loading cart.";
        cart = { items: [], totalCartPrice: 0 };  // Default empty cart on error
      }
  
      // Render the checkout page
      res.render('checkout', {
        title: "Check Out Page",
        user,
        cartId: cart._id || null,
        addresses: paginatedAddresses,
        cart: {
          items: paginatedCartItems,
          totalCartPrice: cart.totalCartPrice
        },
        currentAddressPage,
        currentCartPage,
        totalCartPages,
        totalAddressPages,
        cartMessage,
        addressMessage,
        addressLimit,
        cartLimit,
      });
  
    } catch (error) {
      console.error("Error in checkoutLoad method:", error);
      const backLink = req.headers.referer || `/cartView`;
      renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while loading the checkout page.", backLink);
    }
  };
  


module.exports = {
    checkoutLoad
}