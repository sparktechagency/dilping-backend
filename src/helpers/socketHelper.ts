import { RequestValidations } from './../app/modules/request/request.validation'
import colors from 'colors'
import { Server } from 'socket.io'
import { logger } from '../shared/logger'
import { jwtHelper } from './jwtHelper'
import config from '../config'
import { onlineUsers } from '../server'
import { Notification } from '../app/modules/notifications/notifications.model'
import { IRequest } from '../app/modules/request/request.interface'
import { socketMiddleware } from '../app/middleware/socketMiddleware'
import { USER_ROLES } from '../enum/user'
import validateRequest, {
  validateSocketData,
} from '../app/middleware/validateRequest'

const socket = (io: Server) => {
  io.on('connection', socket => {
    const user = socketMiddleware.socketAuth(
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.BUSINESS,
    )

    logger.info(colors.blue('⚡ A user connected'))

    socket.on('authenticate', (token: string) => {
      const parsedToken = JSON.parse(token)
      const jwtToken = parsedToken?.token.split(' ')[1]

      try {
        const { authId } = jwtHelper.verifyToken(
          jwtToken,
          config.jwt.jwt_secret as string,
        )
        onlineUsers.set(socket.id, authId)

        //write a function to handle notifications
        sendNotificationsToAllConnectedUsers()
      } catch (error) {
        logger.error(error)
      }
    })

    socket.on(`request`, async (data: { token: string; request: IRequest }) => {
      console.log('socket', data)
      const user = socketMiddleware.handleSocketRequest(
        socket,
        JSON.parse(data as unknown as any).token,
        USER_ROLES.USER,
      )

      //validate upcoming request data
      validateSocketData(RequestValidations.create, data.request)

      //needs to implement a function to handle request
    })
    //disconnect
    socket.on('disconnect', () => {
      logger.info(colors.red('A user disconnect ⚡'))
    })
  })
}

export const socketHelper = { socket }

const sendNotificationsToAllConnectedUsers = async () => {
  try {
    const connectedUsers = Array.from(onlineUsers.entries())

    await Promise.all(
      connectedUsers.map(async ([socket, userId]) => {
        // Fetch notifications and unread count in parallel
        const [notifications, unreadCount] = await Promise.all([
          Notification.find({ receiver: userId }).lean(),
          Notification.countDocuments({ receiver: userId, isRead: false }),
        ])
        if (notifications.length === 0) return
        //@ts-ignore
        io.to(socket).emit(`notification::${userId}`, {
          ...notifications,
          unreadCount: unreadCount,
        })
      }),
    )
  } catch (error) {
    console.error('Error sending notifications:', error)
  }
}
