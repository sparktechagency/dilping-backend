import { Queue } from "bullmq";
import { redisClient } from "./redis.client";

export const notificationQueue = new Queue('notifications', {
  connection: redisClient
})

export const emailQueue = new Queue('emails', {
  connection: redisClient
})

