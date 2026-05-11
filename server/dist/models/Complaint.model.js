import mongoose, { Schema } from 'mongoose';
export const COMPLAINT_CATEGORIES = [
    'maintenance_plumbing',
    'maintenance_electric',
    'maintenance_furniture',
    'maintenance_internet',
    'maintenance_heating',
    'noise',
    'cleanliness',
    'safety',
    'other',
];
export const COMPLAINT_CATEGORY_LABELS = {
    maintenance_plumbing: 'Сантехник / Ус',
    maintenance_electric: 'Цахилгаан',
    maintenance_furniture: 'Тавилга / Тоног',
    maintenance_internet: 'Интернет / WiFi',
    maintenance_heating: 'Халаалт',
    noise: 'Дуу чимээ',
    cleanliness: 'Цэвэр байдал',
    safety: 'Аюулгүй байдал',
    other: 'Бусад',
};
const complaintSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, enum: COMPLAINT_CATEGORIES, default: 'other', index: true },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected'],
        default: 'pending',
        index: true,
    },
    resolvedAt: { type: Date },
    resolution: { type: String },
}, { timestamps: true });
export const Complaint = mongoose.model('Complaint', complaintSchema);
//# sourceMappingURL=Complaint.model.js.map