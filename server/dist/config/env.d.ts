export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    CLIENT_ORIGIN: string;
    MONGODB_URI: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_ACCESS_EXPIRES: string;
    JWT_REFRESH_EXPIRES: string;
    WEST_LOGIN_URL: string;
    WEST_FETCH_TIMEOUT_MS: number;
    QPAY_BASE_URL: string;
    QPAY_CLIENT_ID: string;
    QPAY_CLIENT_SECRET: string;
    QPAY_INVOICE_CODE: string;
    QPAY_MOCK: boolean;
    REDIS_URL?: string | undefined;
    BACKEND_PUBLIC_URL?: string | undefined;
};
