import { createClient } from 'redis'

export const redisClient = createClient()

redisClient.on('error', err => {
  console.error('Redis client error:', err)
})
