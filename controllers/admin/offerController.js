
const Offer = require("../../models/offerSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");


const calculateFinalPrice = (product) => {
    let finalPrice = product.regularPrice;
    const regularPrice = product.regularPrice;

    for (let offer of product.appliedOffers) {
        if (offer.discountType === 'amount') {
            finalPrice = Math.max(0, finalPrice - offer.discountValue);  
        } else if (offer.discountType === 'percentage') {
            const discountAmount = regularPrice * (offer.discountValue / 100);
            finalPrice = Math.max(0, finalPrice - discountAmount);  
        }
    }

    return finalPrice;
};


const loadOffers = async (req,res) => {

    try {
        const offers = await Offer.find({});
        res.render('offers', { offers });
        
    } catch (error) {
        res.status(500).send(err);
    }   
    
    
}

const getOfferAddPage = async (req, res) => {
    try {
        const categories = await Category.find({ status: "Listed" });
        const products = await Product.find({ isDeleted: false });
        
        res.render("offer-add", { categories, products });
    } catch (error) {
        console.error('Error loading offer add page:', error);
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while loading the offer add page.", '/admin/offers');
    }
};





const postAddOffer = async (req, res) => {
    try {
        const { type, title, discountType, discountValue, details, category, product } = req.body;
        const image = req.file ? req.file.filename : null;

        if (!type || !title || !discountType || !discountValue || isNaN(discountValue) || discountValue <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid input. Please check all required fields.' });
        }

        const newOffer = new Offer({
            type,
            title,
            discountType,
            discountValue,
            details,
            image,
            category: type === 'Category' ? category : undefined,
            product: type === 'Product' ? product : undefined,
        });

        await newOffer.save();

        if (newOffer.type === 'Category') {
            const offerProducts = await Product.find({ category: newOffer.category });

            for (let product of offerProducts) {
                product.appliedOffers.push({
                    offerId: newOffer._id,
                    discountValue: newOffer.discountValue,
                    discountType: newOffer.discountType
                });

                product.salePrice = calculateFinalPrice(product);
                await product.save();  
            }
        } else if (newOffer.type === 'Product') {
            const offerProduct = await Product.findById(newOffer.product);
            if (!offerProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            offerProduct.appliedOffers.push({
                offerId: newOffer._id,
                discountValue: newOffer.discountValue,
                discountType: newOffer.discountType
            });

            offerProduct.salePrice = calculateFinalPrice(offerProduct);
            await offerProduct.save();
        }

        res.status(200).json({ success: true, message: 'Offer added successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};






const editOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        res.render('edit-offer', { offer });
    } catch (err) {
        res.status(500).send(err);
    }
}

const postEditOffer  = async (req,res) => {
    try {
        const { type, title, discount, details } = req.body;
        const image = req.file ?  + req.file.filename : req.body.currentImage;
        await Offer.findByIdAndUpdate(req.params.id, { type, title, discount, details, image });
        res.redirect('/admin/offers');
        
    } catch (error) {
        res.status(500).send(error);
        
    }
}

const deleteOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;

        // Find the offer by its ID
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        // Remove the offer from the Offer collection
        await Offer.findByIdAndDelete(offerId);

        // Check if the offer is active before making any updates to products
        if (!offer.isActive) {
            return res.status(200).json({ success: true, message: 'Inactive offer deleted without affecting products.' });
        }

        // If the offer was a category-wide offer, remove it from all products in the category
        if (offer.type === 'Category') {
            const offerProducts = await Product.find({ category: offer.category });

            for (let product of offerProducts) {
                // Remove the offer from the appliedOffers array
                product.appliedOffers = product.appliedOffers.filter(
                    appliedOffer => appliedOffer.offerId.toString() !== offerId
                );

                // Recalculate the sale price only if the offer was active
                product.salePrice = calculateFinalPrice(product);
                await product.save();
            }

        // If the offer was for a single product, remove it from that product
        } else if (offer.type === 'Product') {
            const offerProduct = await Product.findById(offer.product);
            if (!offerProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            // Remove the offer from the appliedOffers array
            offerProduct.appliedOffers = offerProduct.appliedOffers.filter(
                appliedOffer => appliedOffer.offerId.toString() !== offerId
            );

            // Recalculate the sale price only if the offer was active
            offerProduct.salePrice = calculateFinalPrice(offerProduct);
            await offerProduct.save();
        }

        res.status(200).json({ success: true, message: 'Offer deleted successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};





const activateOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        
        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (offer.isActive) {
            return res.status(400).json({ success: false, message: 'Offer is already active' });
        }

        offer.isActive = true;
        await offer.save();

        if (offer.type === 'Category') {
            const offerProducts = await Product.find({ category: offer.category });

            for (let product of offerProducts) {
                product.appliedOffers.push({
                    offerId: offer._id,
                    discountValue: offer.discountValue,
                    discountType: offer.discountType
                });

                product.salePrice = calculateFinalPrice(product);
                await product.save();
            }
        }
        else if (offer.type === 'Product') {
            const offerProduct = await Product.findById(offer.product);
            if (!offerProduct) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }

            offerProduct.appliedOffers.push({
                offerId: offer._id,
                discountValue: offer.discountValue,
                discountType: offer.discountType
            });

            offerProduct.salePrice = calculateFinalPrice(offerProduct);
            await offerProduct.save();
        }

        res.status(200).json({ success: true, message: 'Offer reactivated successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
};



const deactivateOffer = async (req, res) => {
    try {
        const offerId = req.params.offerId;
        await Offer.findByIdAndUpdate(offerId, { isActive: false });

        const products = await Product.find({ 'appliedOffers.offerId': offerId });
        for (let product of products) {
            product.appliedOffers = product.appliedOffers.filter(offer => offer.offerId.toString() !== offerId);
            product.salePrice = calculateFinalPrice(product);
            await product.save();
        }

        res.redirect('/admin/offers');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/offers');
    }
};




module.exports= {
    loadOffers,
    getOfferAddPage,
    postAddOffer,
    editOffer ,
    postEditOffer ,
    deleteOffer,
    activateOffer,
    deactivateOffer

}

