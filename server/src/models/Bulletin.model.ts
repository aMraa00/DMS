import mongoose, { Schema } from 'mongoose'

export const BULLETIN_TYPES = ['sell', 'buy', 'lost', 'found', 'announce', 'service'] as const
export type BulletinType = (typeof BULLETIN_TYPES)[number]

export const BULLETIN_TYPE_LABELS: Record<BulletinType, string> = {
  sell: 'Зарна',
  buy: 'Худалдаж авна',
  lost: 'Алдсан',
  found: 'Олдсон',
  announce: 'Зарлал',
  service: 'Үйлчилгээ',
}

export interface IBulletin {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: BulletinType
  title: string
  body: string
  contactPhone?: string
  price?: number
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const bulletinSchema = new Schema<IBulletin>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: BULLETIN_TYPES, required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 2000 },
    contactPhone: { type: String },
    price: { type: Number },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
)

bulletinSchema.index({ isActive: 1, createdAt: -1 })

export const Bulletin = mongoose.model<IBulletin>('Bulletin', bulletinSchema)
