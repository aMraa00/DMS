import mongoose, { Schema } from 'mongoose'

export interface IStaff {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  dormId?: mongoose.Types.ObjectId
  role: 'manager' | 'professional' | 'accountant' | 'security'
  employedAt?: Date
  hiredAt?: Date
}

const staffSchema = new Schema<IStaff>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dormId: { type: Schema.Types.ObjectId, ref: 'Dorm' },
    role: {
      type: String,
      enum: ['manager', 'professional', 'accountant', 'security'],
      required: true,
    },
    employedAt: { type: Date },
    hiredAt: { type: Date },
  },
  { timestamps: true },
)

export const Staff = mongoose.model<IStaff>('Staff', staffSchema)
