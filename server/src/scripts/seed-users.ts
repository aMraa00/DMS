import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDb } from '../db/connect.js'
import { seedDemoUsers } from './seed-demo-users.js'

await connectDb()
// eslint-disable-next-line no-console -- script output
console.log(`  MongoDB database: ${mongoose.connection.db?.databaseName ?? '(unknown)'}`)
const { count, demoPassword } = await seedDemoUsers()

// eslint-disable-next-line no-console -- script output
console.log(`Seed users: upserted ${count} demo accounts (local login).`)
// eslint-disable-next-line no-console -- script output
console.log(`  Password (${demoPassword === process.env.SEED_DEMO_PASSWORD?.trim() ? 'SEED_DEMO_PASSWORD' : 'default Demo123456!'}): ${demoPassword}`)

await mongoose.disconnect()
