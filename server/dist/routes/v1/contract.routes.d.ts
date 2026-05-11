export declare const contractRouter: import("express-serve-static-core").Router;
/** Админ/систем – төлбөр батлагдсаны дараа дуудагдах жишээ (одоогоор seed/dev) */
export declare function stubCreateContract(opts: {
    userId: string;
    roomId: string;
    startDate: Date;
    endDate: Date;
    isHalfYear: boolean;
}): Promise<import("mongoose").Document<unknown, {}, import("../../models/Contract.model.js").IContract, {}, {}> & import("../../models/Contract.model.js").IContract & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}>;
