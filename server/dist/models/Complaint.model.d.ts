import mongoose from 'mongoose';
export declare const COMPLAINT_CATEGORIES: readonly ["maintenance_plumbing", "maintenance_electric", "maintenance_furniture", "maintenance_internet", "maintenance_heating", "noise", "cleanliness", "safety", "other"];
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
export declare const COMPLAINT_CATEGORY_LABELS: Record<ComplaintCategory, string>;
export interface IComplaint {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    title: string;
    content: string;
    category: ComplaintCategory;
    status: 'pending' | 'resolved' | 'rejected';
    createdAt: Date;
    resolvedAt?: Date;
    resolution?: string;
}
export declare const Complaint: mongoose.Model<IComplaint, {}, {}, {}, mongoose.Document<unknown, {}, IComplaint, {}, {}> & IComplaint & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
