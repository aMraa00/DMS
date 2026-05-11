import mongoose, { Schema } from 'mongoose'
import type { Role } from '../types/roles.js'

export interface IUser {
  _id: mongoose.Types.ObjectId
  registerNumber?: string
  studentId?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  passwordHash?: string
  /** 1-5 / Mar / DoK — used for priority */
  level?: string
  school?: string
  program?: string
  region?: string
  gender?: 'M' | 'F'
  isDisabled?: boolean
  hasInsurance?: boolean
  /** WEST login name if linked */
  westLoginName?: string
  role: Role
  status: string
  /** Relative public URL served from /uploads/avatars/:id.:ext */
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    registerNumber: { type: String, sparse: true, unique: true },
    studentId: { type: String, sparse: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    level: { type: String, trim: true },
    school: { type: String, trim: true },
    program: { type: String, trim: true },
    region: { type: String, trim: true },
    gender: { type: String, enum: ['M', 'F'] },
    isDisabled: { type: Boolean, default: false },
    hasInsurance: { type: Boolean, default: false },
    westLoginName: { type: String, sparse: true, unique: true },
    role: {
      type: String,
      enum: ['student', 'staff', 'admin', 'accountant'],
      default: 'student',
    },
    status: { type: String, default: 'active' },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true },
)

export const User = mongoose.model<IUser>('User', userSchema)
