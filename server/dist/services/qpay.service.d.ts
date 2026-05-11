/**
 * QPay Merchant API v2 (Sodon-Sondor төслийн qpayService-тэй ижил логик)
 * Sandbox: https://merchant-sandbox.qpay.mn · ENV-ээр production руу шилжүүлнэ.
 */
type QpayInvoiceResponse = {
    invoice_id?: string;
    qr_text?: string;
    qr_image?: string;
    qPay_shortUrl?: string;
    qPay_deeplink?: {
        name?: string;
        description?: string;
        logo?: string;
        link?: string;
    }[];
};
type QpayCheckResponse = {
    count?: number;
    rows?: {
        payment_id?: string;
    }[];
};
export declare function createInvoice(args: {
    senderInvoiceNo: string;
    amount: number;
    description: string;
    callbackUrl: string;
    receiverData?: {
        register?: string;
        name?: string;
        email?: string;
        phone?: string;
    };
}): Promise<QpayInvoiceResponse>;
export declare function checkPayment(invoiceId: string): Promise<QpayCheckResponse>;
export declare function cancelInvoice(invoiceId: string): Promise<void>;
export {};
