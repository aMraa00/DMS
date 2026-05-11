import { Router } from 'express'
import { z } from 'zod'
import { Room } from '../../models/Room.model.js'
import { Dorm } from '../../models/Dorm.model.js'
import { authenticate, requireRoles, type AuthedRequest } from '../../middleware/auth.middleware.js'
import { User } from '../../models/User.model.js'

export const roomRouter = Router()

roomRouter.use(authenticate)
roomRouter.use(requireRoles('student'))

roomRouter.get('/available', async (req: AuthedRequest, res) => {
  const q = z
    .object({
      dormId: z.string().optional(),
      gender: z.enum(['M', 'F']).optional(),
    })
    .safeParse(req.query)

  if (!q.success) {
    res.status(400).json({ error: q.error.flatten() })
    return
  }

  const user = await User.findById(req.user!.id)

  const filter: Record<string, unknown> = { status: 'free' }
  if (q.data.dormId) filter.dormId = q.data.dormId

  const rooms = await Room.find(filter).limit(200).lean()
  const dormIds = [...new Set(rooms.map((r) => String(r.dormId)))]
  const dorms = await Dorm.find({ _id: { $in: dormIds } }).lean()
  const dormMap = new Map(dorms.map((d) => [String(d._id), d]))

  const genderFilter = q.data.gender ?? user?.gender

  const list = rooms
    .filter((r) => {
      const d = dormMap.get(String(r.dormId))
      if (!d) return false
      if (!genderFilter) return true
      return d.genderType === 'MIXED' || d.genderType === genderFilter
    })
    .map((r) => {
      const d = dormMap.get(String(r.dormId))
      return {
        id: String(r._id),
        dormId: String(r.dormId),
        floorId: String(r.floorId),
        roomNumber: r.roomNumber,
        maxOccupancy: r.maxOccupancy,
        currentOccupancy: r.currentOccupancy,
        monthlyFee: r.monthlyFee,
        type: r.type,
        isFamilyRoom: r.isFamilyRoom,
        dormName: d?.name,
        dormGender: d?.genderType,
      }
    })

  res.json({ rooms: list })
})

roomRouter.get('/:id', async (req: AuthedRequest, res) => {
  const room = await Room.findById(req.params.id).lean()
  if (!room) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  const dorm = await Dorm.findById(room.dormId).lean()
  res.json({
    room: {
      ...room,
      _id: String(room._id),
      dormId: String(room.dormId),
      floorId: String(room.floorId),
      dorm,
    },
  })
})
