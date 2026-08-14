import 'server-only'
import { Redis } from '@upstash/redis'

export const CACHE_TTL = 60 * 60 * 24 * 7 // 7 days

function getRedis(): Redis | null {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null
    }
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch {
    return null
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis()
    if (!redis) return null
    return await redis.get<T>(key)
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown): Promise<void> {
  try {
    const redis = getRedis()
    if (!redis) return
    await redis.set(key, value, { ex: CACHE_TTL })
  } catch {
    // fail silently
  }
}
