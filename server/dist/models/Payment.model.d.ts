import mongoose from 'mongoose';
export interface IPayment {
    _id: mongoose.Types.ObjectId;
    contractId?: mongoose.Types.ObjectId;
    applicationId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    amount: number;
    paidAt?: Date;
    type: 'FULL' | 'HALF' | 'SUMMER';
    status: 'paid' | 'pending' | 'failed';
    penalty: number;
    transactionId?: string;
    method: 'QPay' | 'BankTransfer' | 'Card';
    /** QPay invoice / QR */
    qpayInvoiceId?: string;
    qpayPaymentId?: string;
    qrText?: string;
    qrImage?: string;
    qpayShortUrl?: string;
    qpayDeeplinks?: unknown[];
}
export declare const Payment: mongoose.Model<IPayment, {}, {}, {}, mongoose.Document<unknown, {}, IPayment, {}, {}> & IPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
