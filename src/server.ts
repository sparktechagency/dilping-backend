import colors from 'colors'
import mongoose from 'mongoose'
import { Server } from 'socket.io'
import app from './app'
import config from './config'

import { errorLogger, logger } from './shared/logger'
import { socketHelper } from './helpers/socketHelper'
import { jwtHelper } from './helpers/jwtHelper'
import { UserServices } from './app/modules/user/user.service'
import { redisClient } from './helpers/redis.client'

//uncaught exception
process.on('uncaughtException', error => {
  errorLogger.error('UnhandledException Detected', error)
  process.exit(1)
})

export const onlineUsers = new Map()
let server: any
async function main() {
  try {
    mongoose.connect(config.database_url as string)
    logger.info(colors.green('🚀 Database connected successfully'))

    const port =Number(config.port)

    server = app.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️  Application listening on port:${config.port}`),
      )
    })

    //create admin user
    await UserServices.createAdmin()

    await redisClient.connect()
    logger.info(colors.green('🎃 Redis connected successfully'))

    //socket
    const io = new Server(server, {
      pingTimeout: 60000,
      cors: {
        origin: '*',
      },
    })
    socketHelper.socket(io)
    //@ts-ignore
    global.io = io
  } catch (error) {
    errorLogger.error(colors.red('🤢 Failed to connect Database'))
  }

  //handle unhandleRejection
  process.on('unhandledRejection', error => {
    if (server) {
      server.close(() => {
        errorLogger.error('UnhandledRejection Detected', error)
        process.exit(1)
      })
    } else {
      process.exit(1)
    }
  })
}

main()

//SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVE')
  if (server) {
    server.close()
  }
})
