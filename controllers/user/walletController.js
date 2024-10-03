
const User = require('../../models/userSchema');
const Wallet = require('../../models/walletSchema');


const renderErrorPage = (res, errorCode, errorMessage, errorDescription, backLink) => {
    res.status(errorCode).render('error-page', {
        errorCode,
        errorMessage,
        errorDescription,
        backLink
    });
};

const loadWallet = async (req, res) => {
    try {
        const user = await User.findById(req.session.user);
        const wallet = await Wallet.findOne({ userId: user._id });

        if (!wallet) {
            return res.render('walletNotFound', {
                title: "My Wallet",
                user,
            });
        }

        return res.render('wallet', { 
            title: "My Wallet",
            user,
            wallet 
        });
    } catch (error) {
        console.error(error);
        
        const backLink = req.headers.referer || '/';
        renderErrorPage(res, 500, "Internal Server Error", "An unexpected error occurred while loading your wallet. Please try again later", backLink);
    }
}



const addFundInWallet = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);
        const paymentMethod = req.body.paymentMethod;

        // Validate amount
        if (isNaN(amount) || amount <= 0) {
            return renderErrorPage(res, 400, "Invalid Amount", "Please enter a valid amount greater than zero.", "/wallet");
        }

        // Validate payment method
        const validPaymentMethods = ['creditCard', 'debitCard', 'netBanking', 'upi', 'wallet'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return renderErrorPage(res, 400, "Invalid Payment Method", "Please select a valid payment method.", "/wallet");
        }

        // Find the user's wallet
        const wallet = await Wallet.findOne({ userId: req.session.user });
        if (!wallet) {
            return renderErrorPage(res, 404, "Wallet Not Found", "You do not have a wallet. Please create one first.", "/create-wallet");
        }

        // Credit the amount to the wallet
        await wallet.credit(amount, `Funds added via ${paymentMethod}`);
        return res.redirect('/wallet');

    } catch (error) {
        console.error(error);
        return renderErrorPage(res, 500, "Unexpected Error", "An error occurred while adding funds to your wallet. Please try again later.", "/wallet");
    }
};



const refundInWallet = async (req, res) => {
    try {
        const amount = parseFloat(req.body.amount);

        // Validate if the amount is a valid number
        if (isNaN(amount) || amount <= 0) {
            return renderErrorPage(res, 400, "Invalid Amount", "Please enter a valid amount greater than zero.", "/wallet");
        }

        // Find the user's wallet based on session user ID
        const wallet = await Wallet.findOne({ userId: req.session.user });

        // If no wallet found, return an error
        if (!wallet) {
            return renderErrorPage(res, 404, "Wallet Not Found", "You do not have a wallet. Please create one first.", "/create-wallet");
        }

        // Check if sufficient funds exist in the wallet for the refund
        if (wallet.balance < amount) {
            return renderErrorPage(res, 400, "Insufficient Funds", "You do not have enough balance to issue this refund.", "/wallet");
        }

        // Debit the refund amount from the wallet
        await wallet.debit(amount, "Refund issued");

        // Log refund transaction for debugging and audits
        console.log(`Refund of $${amount} issued for user ${req.session.user}`);

        // Redirect to wallet page after refund
        return res.redirect('/wallet');

    } catch (error) {
        // Enhanced error logging for debugging
        console.error("Refund processing error: ", error);

        // Render error page in case of unexpected errors
        return renderErrorPage(res, 500, "Unexpected Error", "An error occurred while processing your refund. Please try again later.", "/wallet");
    }
};




const createWallet = async (req, res) => {
    try {
        const user = await User.findById(req.session.user)
        const existingWallet = await Wallet.findOne({ userId: user._id});

        if (existingWallet) {
            
            const backLink = req.headers.referer || '/';
            renderErrorPage(res, 400, "Wallet Creation Error", "You already have a wallet", backLink);
        }

        const newWallet = new Wallet({
            userId: user._id,
            balance: 0,
            transactions: []
        });

        await newWallet.save();
        return res.redirect('/wallet'); // Redirect to the wallet page after successful creation

    } catch (error) {
        console.error(error); 

        
        const backLink = req.headers.referer || '/';
        renderErrorPage(res, 500, "Server Error", "An unexpected error occurred while creating your wallet. Please try again later.", backLink);
        
    }
}


module.exports = {
    loadWallet, 
    addFundInWallet,
    refundInWallet  ,
    createWallet
}