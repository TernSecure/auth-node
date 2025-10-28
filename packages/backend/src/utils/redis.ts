import { Redis } from "@upstash/redis"

import { redisLogger } from "./logger"

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
})

export interface DisabledUserRecord {
  uid: string
  email: string
  disabledTime: string
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly defaultTTL: number

  constructor(defaultTTLMs: number = 60000) { // Default 1 minute
    this.defaultTTL = defaultTTLMs
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTTL)
    this.cache.set(key, { value, expiresAt })
    console.log(`TTLCache.set: key=${key}, value=${JSON.stringify(value)}, expiresAt=${expiresAt}, cacheSize=${this.cache.size}`)
  }

  private getEntry(key: string): CacheEntry<T> | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined

    const now = Date.now()
    if (now > entry.expiresAt) {
      console.log(`TTLCache: key=${key} expired (now=${now}, expiresAt=${entry.expiresAt})`)
      this.cache.delete(key)
      return undefined
    }

    return entry
  }

  get(key: string): T | undefined {
    const entry = this.getEntry(key)
    console.log(`TTLCache.get: key=${key}, entry=${JSON.stringify(entry)}, hasEntry=${!!entry}`)
    
    if (!entry) return undefined

    console.log(`TTLCache.get: returning value=${JSON.stringify(entry.value)}`)
    return entry.value
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

// Cache for disabled user records - 30 second TTL to balance performance and consistency
const disabledUserCache = new TTLCache<DisabledUserRecord | null>(30000)

// Cleanup expired entries every 5 minutes
setInterval(() => disabledUserCache.cleanup(), 5 * 60 * 1000)

export async function getDisabledUser(uid: string): Promise<DisabledUserRecord | null> {
  const cacheKey = `disabled_user:${uid}`
  
  redisLogger.debug(`Checking cache for key: ${cacheKey}`)
  
  // Check cache first
  const cachedResult = disabledUserCache.get(cacheKey)
  if (cachedResult !== undefined) {
    redisLogger.debug(`Cache hit for disabled user: ${uid}`, { 
      cacheKey,
      cachedResult: JSON.stringify(cachedResult)
    })
    return cachedResult
  }

  redisLogger.debug(
    `Cache miss for disabled user: ${uid}, fetching from Redis with key: ${cacheKey}`
  )

  try {
    const disabledUser: DisabledUserRecord | null = await redis.get(cacheKey)
    
    redisLogger.debug(`Redis returned for key ${cacheKey}:`, { 
      disabledUser: JSON.stringify(disabledUser),
      type: typeof disabledUser
    })

    // Cache the result (including null values to prevent repeated Redis calls for non-disabled users)
    disabledUserCache.set(cacheKey, disabledUser)
    
    redisLogger.debug(`Cached disabled user result for: ${uid}`, {
      cacheKey,
      isDisabled: !!disabledUser,
      cachedValue: JSON.stringify(disabledUser)
    })
    
    return disabledUser
  } catch (error) {
    redisLogger.error('Failed to fetch disabled user from Redis:', error)
    return null
  }
}

export function invalidateDisabledUserCache(uid: string): void {
  const cacheKey = `disabled_user:${uid}`
  disabledUserCache.delete(cacheKey)
}
