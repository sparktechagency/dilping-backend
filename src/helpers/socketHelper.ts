import { RequestValidations } from './../app/modules/request/request.validation'
import colors from 'colors'
import { Server, Socket } from 'socket.io'
import { logger } from '../shared/logger'
import config from '../config'
import { onlineUsers } from '../server'
import { Notification } from '../app/modules/notifications/notifications.model'
import { IRequest } from '../app/modules/request/request.interface'
import { socketMiddleware } from '../app/middleware/socketMiddleware'
import { USER_ROLES } from '../enum/user'
import { JwtPayload } from 'jsonwebtoken'

import { RequestService } from '../app/modules/request/request.service'

// Define interface for socket with user data
export interface SocketWithUser extends Socket {
  user?: JwtPayload & {
    authId: string
    role: string
  }
}

const socket = (io: Server) => {
  // Apply authentication middleware to all connections
  io.use(
    socketMiddleware.socketAuth(
      USER_ROLES.USER,
      USER_ROLES.ADMIN,
      USER_ROLES.BUSINESS,
    ),
  )

  io.on('connection', (socket: SocketWithUser) => {
    if (socket.user) {
      onlineUsers.set(socket.id, socket.user.authId)
      logger.info(colors.blue(`⚡ User ${socket.user.authId} connected`))

      // Send notifications only on initial connection
      sendNotificationsToAllConnectedUsers(socket)

      registerEventHandlers(socket)
    }
  })
}

// Separate function to register all event handlers
const registerEventHandlers = (socket: SocketWithUser) => {
  socket.on('request', async data => {
    try {
      //authorize the request here
      socketMiddleware.handleSocketRequest(socket, USER_ROLES.ADMIN)
      //validate the request here
      const validatedData = socketMiddleware.validateEventData(
        socket,
        RequestValidations.create,
        JSON.parse(data),
      )

      if (!validatedData) return
      const request = validatedData as IRequest

      //handle the request here
      await RequestService.createRequest(socket, request)
    } catch (error) {
      logger.error('Error handling request:', error)
    }
  })

  // Disconnect handler
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id)
    logger.info(
      colors.red(`User ${socket.user?.authId || 'Unknown'} disconnected ⚡`),
    )
  })
}

const sendNotificationsToAllConnectedUsers = async (socket: SocketWithUser) => {
  try {
    const userId = socket.user?.authId
    if (!userId) return

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ receiver: userId }).lean(),
      Notification.countDocuments({ receiver: userId, isRead: false }),
    ])

    socket.emit(`notification::${userId}`, {
      notifications,
      unreadCount,
    })
  } catch (error) {
    logger.error('Error sending notifications:', error)
  }
}

export const socketHelper = {
  socket,
  sendNotificationsToAllConnectedUsers,
}
