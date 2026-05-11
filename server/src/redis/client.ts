import { Redis } from 'ioredis'
import { env } from '../config/env.js'

let client: Redis | null = null

export function getRedis(): Redis | null {
  if (!env.REDIS_URL) return null
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
  }
  return client
}

export async function rememberRefresh(userId: string, jti: string, ttlSeconds: number) {
  const redis = getRedis()
  if (!redis) return
  const key = `refresh:${userId}:${jti}`
  await redis.set(key, '1', 'EX', ttlSeconds)
}

export async function forgetRefresh(userId: string, jti: string) {
  const redis = getRedis()
  if (!redis) return
  await redis.del(`refresh:${userId}:${jti}`)
}

export async function hasRefresh(userId: string, jti: string) {
  const redis = getRedis()
  if (!redis) return true
  const key = `refresh:${userId}:${jti}`
  const v = await redis.get(key)
  return v !== null
}
