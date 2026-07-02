import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    paymentMethod: {
        type: String,
        enum: ['credit_card', 'paypal', 'cash_on_delivery', 'cash', 'bank_transfer', 'waafi', 'mwallet'],
        required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'approved', 'refunded'],
        default: 'pending',
    },
    verificationStatus: {
        type: String,
        enum: ['not_required', 'pending', 'verified', 'rejected'],
        default: 'not_required',
    },
    referenceId: { type: String },
    transactionId: { type: String },
    offlineDetails: {
        bankName: String,
        accountName: String,
        transferReference: String,
        proofUrl: String,
        cashReceivedBy: String,
        notes: String,
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    verificationNote: { type: String },
    waafiResponse: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
