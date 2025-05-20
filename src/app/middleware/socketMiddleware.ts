import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import { logger } from '../../shared/logger'
import colors from 'colors'
import ApiError from '../../errors/ApiError'

interface SocketWithUser extends Socket {
  user?: {
    authId: string
    role: string
  }
}

const socketAuth = (...roles: string[]) => {
  return (socket: SocketWithUser, next: (err?: ExtendedError) => void) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.query.token ||
        socket.handshake.headers.authorization

      logger.info(colors.green(`Socket authentication token: ${token}`))

      if (!token) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'You does not have token to access this resource.',
        )
      }

      try {
        // Parse token if it's in JSON format
        let jwtToken = token
        if (typeof token === 'string' && token.includes('{')) {
          const parsedToken = JSON.parse(token)
          jwtToken = parsedToken?.token.split(' ')[1]
        } else if (typeof token === 'string' && token.startsWith('Bearer ')) {
          jwtToken = token.split(' ')[1]
        }

        // Verify token
        const verifiedUser = jwtHelper.verifyToken(
          jwtToken,
          config.jwt.jwt_secret as Secret,
        )

        socket.user = {
          authId: verifiedUser.authId,
          role: verifiedUser.role,
        }

        // Guard user based on roles
        if (roles.length && !roles.includes(verifiedUser.role)) {
          logger.error(
            colors.red(
              `Socket authentication failed: User role ${verifiedUser.role} not authorized`,
            ),
          )
          return next(
            new Error("You don't have permission to access this socket event"),
          )
        }

        logger.info(
          colors.green(`Socket authenticated for user: ${verifiedUser.authId}`),
        )
        next()
      } catch (error) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized')
      }
    } catch (error) {
      //@ts-ignore
      next(error)
    }
  }
}

const handleSocketRequest = (
  socket: Socket,
  token: string,
  ...roles: string[]
) => {
  try {
    let jwtToken
    if (typeof token === 'string' && token.includes('{')) {
      const parsedToken = JSON.parse(token)
      jwtToken = parsedToken?.token.split(' ')[1]
    } else if (typeof token === 'string' && token.startsWith('Bearer ')) {
      jwtToken = token.split(' ')[1]
    } else {
      jwtToken = token
    }

    // Verify token
    const verifiedUser = jwtHelper.verifyToken(
      jwtToken,
      config.jwt.jwt_secret as Secret,
    )

    // Guard user based on roles
    if (roles.length && !roles.includes(verifiedUser.role)) {
      socket.emit('error', {
        error: 'Forbidden',
        message: "You don't have permission to access this socket event",
      })
      //   throw new ApiError(
      //     StatusCodes.FORBIDDEN,
      //     "You don't have permission to access this API",
      //   )
    }

    return {
      user: verifiedUser,
    }
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized')
  }
}

export const socketMiddleware = { socketAuth, handleSocketRequest }
