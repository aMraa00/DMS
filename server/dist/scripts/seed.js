import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDb } from '../db/connect.js';
import { Dorm } from '../models/Dorm.model.js';
import { Floor } from '../models/Floor.model.js';
import { Room } from '../models/Room.model.js';
import { seedDemoUsers } from './seed-demo-users.js';
await connectDb();
const dorms = await Dorm.insertMany([
    { name: '1-P байр', address: 'Номын сангийн хажууд', genderType: 'M', capacity: 200, totalFloors: 5, totalRooms: 80 },
    { name: '2-P байр', address: 'Ховд аймаг, Жаргалант суурин', genderType: 'F', capacity: 200, totalFloors: 5, totalRooms: 80 },
]);
const roomsToCreate = [];
for (const d of dorms) {
    for (let f = 1; f <= 3; f += 1) {
        let floorDoc = await Floor.findOne({ dormId: d._id, floorNumber: f });
        if (!floorDoc) {
            const createdFloors = await Floor.create([
                { dormId: d._id, floorNumber: f, label: `${f}-р давхар` },
            ]);
            floorDoc = createdFloors[0];
        }
        for (let r = 1; r <= 4; r += 1) {
            roomsToCreate.push({
                dormId: d._id,
                floorId: floorDoc._id,
                roomNumber: f * 100 + r,
                maxOccupancy: 2,
                currentOccupancy: 0,
                monthlyFee: 180_000 + r * 1000,
                status: 'free',
                type: 'regular',
            });
        }
    }
}
await Room.insertMany(roomsToCreate);
// eslint-disable-next-line no-console -- script output
console.log(`Seeded ${dorms.length} dorms and ${roomsToCreate.length} rooms.`);
const userSeed = await seedDemoUsers();
// eslint-disable-next-line no-console -- script output
console.log(`Seeded demo users: ${userSeed.count} (${userSeed.demoPassword}. Солих: SEED_DEMO_PASSWORD урт ≥8)\n`, '  Имэйл: admin@dms.demo, staff@dms.demo, accountant@dms.demo, student@dms.demo, student2@dms.demo');
await mongoose.disconnect();
//# sourceMappingURL=seed.js.map