import mongoose, { Schema } from 'mongoose'

export const BOOKING_RESOURCES = [
  'washing_machine_1',
  'washing_machine_2',
  'washing_machine_3',
  'dryer_1',
  'study_room_a',
  'study_room_b',
  'common_room',
  'gym',
] as const

export type BookingResource = (typeof BOOKING_RESOURCES)[number]

export const BOOKING_RESOURCE_LABELS: Record<BookingResource, string> = {
  washing_machine_1: 'Угаалгын машин №1',
  washing_machine_2: 'Угаалгын машин №2',
  washing_machine_3: 'Угаалгын машин №3',
  dryer_1: 'Хатаагч №1',
  study_room_a: 'Номын өрөө А',
  study_room_b: 'Номын өрөө Б',
  common_room: 'Нийтийн өрөө',
  gym: 'Дасгалын танхим',
}

export const BOOKING_SLOTS = [
  '07:00-08:00',
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00',
] as const

export type BookingSlot = (typeof BOOKING_SLOTS)[number]

export interface IBooking {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  resource: BookingResource
  date: string
  timeSlot: BookingSlot
  status: 'active' | 'cancelled' | 'completed'
  note?: string
  createdAt: Date
  updatedAt: Date
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resource: { type: String, enum: BOOKING_RESOURCES, required: true },
    date: { type: String, required: true },
    timeSlot: { type: String, enum: BOOKING_SLOTS, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active', index: true },
    note: { type: String },
  },
  { timestamps: true },
)

bookingSchema.index({ resource: 1, date: 1, timeSlot: 1, status: 1 })
bookingSchema.index({ userId: 1, date: 1 })

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema)
