import mongoose from 'mongoose'
import { Contract } from '../models/Contract.model.js'
import { Dorm } from '../models/Dorm.model.js'
import { Room } from '../models/Room.model.js'
import { User } from '../models/User.model.js'

function dormGenderAllows(dormGender: 'M' | 'F' | 'MIXED', studentGender?: 'M' | 'F'): boolean {
  if (dormGender === 'MIXED') return true
  if (!studentGender) return true
  return dormGender === studentGender
}

export type MoveContractRoomFailure = { ok: false; status: number; message: string }
export type MoveContractRoomOk = { ok: true }

/**
 * Өрөө солих хүсэлт шийдвэрлэгдэх үед гэрээний өрөөг шилжүүлнэ (/contracts/me-д гарна).
 */
export async function moveStudentContractToRoom(
  userId: string,
  newRoomId: string,
): Promise<MoveContractRoomFailure | MoveContractRoomOk> {
  if (!mongoose.isValidObjectId(newRoomId)) {
    return { ok: false, status: 400, message: 'Буруу өрөөний таних тэмдэг' }
  }

  const newOid = new mongoose.Types.ObjectId(newRoomId)

  const contract = await Contract.findOne({
    userId,
    status: { $in: ['pending_sign', 'active'] },
  }).sort({ updatedAt: -1 })

  if (!contract) {
    return {
      ok: false,
      status: 409,
      message:
        'Энэ оюутанд идэвхтэй гэрээ байхгүй тул системд өөрөөр автоматаар шилжүүлэх боломжгүй. Эхлээд гэрээтэй байх ёстой.',
    }
  }

  const oldOid = contract.roomId
  if (oldOid.equals(newOid)) {
    return { ok: true }
  }

  const [student, newRoom] = await Promise.all([User.findById(userId).lean(), Room.findById(newOid).lean()])

  if (!newRoom) {
    return { ok: false, status: 404, message: 'Сонгосон өрөө олдсонгүй' }
  }

  const dorm = await Dorm.findById(newRoom.dormId).lean()
  if (!dorm || !['M', 'F', 'MIXED'].includes(dorm.genderType)) {
    return { ok: false, status: 400, message: 'Дотуур байрын мэдээлэл алга эсвэл буруу' }
  }

  if (!dormGenderAllows(dorm.genderType as 'M' | 'F' | 'MIXED', student?.gender)) {
    return {
      ok: false,
      status: 403,
      message: 'Сонгосон дотуур байр хүйсийн хязгаарлалтын дагуу оюутны профайлтай үл нийцэж байна',
    }
  }

  if (newRoom.status === 'maintenance') {
    return { ok: false, status: 409, message: 'Сонгосон өрөө засварын горимд байна' }
  }

  const occ = newRoom.currentOccupancy ?? 0
  const cap = newRoom.maxOccupancy ?? 0
  if (occ >= cap) {
    return { ok: false, status: 409, message: 'Сонгосон өрөө дүүрсэн байна' }
  }

  contract.roomId = newOid
  await contract.save()

  await Room.updateOne({ _id: oldOid }, { $inc: { currentOccupancy: -1 } })
  await Room.updateOne({ _id: newOid }, { $inc: { currentOccupancy: 1 } })

  return { ok: true }
}
