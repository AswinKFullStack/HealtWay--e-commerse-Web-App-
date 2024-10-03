const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema({
    type: {
        type: String,
        enum: ['credit', 'debit'], 
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    transactionDate: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

const walletSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        required: true
    },
    transactions: [transactionSchema] 
}, {
    timestamps: true
});


walletSchema.methods.credit = function(amount, description) {
    this.balance += amount;
    this.transactions.push({
        type: 'credit',
        amount,
        description
    });
    return this.save();
};

walletSchema.methods.debit = function(amount, description) {
    if (this.balance >= amount) {
        this.balance -= amount;
        this.transactions.push({
            type: 'debit',
            amount,
            description
        });
        return this.save();
    } else {
        throw new Error("Insufficient balance");
    }
};


const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;