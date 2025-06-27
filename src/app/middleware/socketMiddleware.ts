import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { StatusCodes } from 'http-status-codes'
import { Secret } from 'jsonwebtoken'
import config from '../../config'
import { jwtHelper } from '../../helpers/jwtHelper'
import { logger } from '../../shared/logger'
import colors from 'colors'
import ApiError from '../../errors/ApiError'
import { ZodSchema } from 'zod'
import handleZodError from '../../errors/handleZodError'
import { SocketWithUser } from '../../helpers/socketHelper'
import { ErrorResponse } from '../../interfaces/socket'

const socketAuth = (...roles: string[]) => {
  return (socket: SocketWithUser, next: (err?: ExtendedError) => void) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.query.token ||
        socket.handshake.headers.authorization



      if (!token) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Authentication token is required to access this resource',
        )
      }

      try {
        let jwtToken = extractToken(token)

        // Verify token
        const verifiedUser = jwtHelper.verifyToken(jwtToken, config.jwt.jwt_secret as Secret)

        // Attach user to socket
        socket.user = {
          authId: verifiedUser.authId,
          role: verifiedUser.role,
          ...verifiedUser,
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
      if (error instanceof ApiError) {
        const apiError = error as ApiError
        const errorResponse: ErrorResponse = {
          statusCode: apiError.statusCode,
          error: getErrorName(apiError.statusCode),
          message: apiError.message,
        }
        socket.emit('socket_error', errorResponse)
      }
      next(error as ExtendedError)
    }
  }
}

/**
 * Event-specific authorization middleware
 * Verifies user has permission to access specific event
 */

/**
 * Validate socket event data against schema
 */
const validateEventData = <T>(
  socket: Socket,
  schema: ZodSchema,
  data: any,
): T | null => {
  try {
    return schema.parse(data) as T
  } catch (error: any) {
    const zodError = handleZodError(error)
    socket.emit('socket_error', {
      statusCode: zodError.statusCode,
      error: getErrorName(zodError.statusCode),
      message: zodError.message,
      errorMessages: zodError.errorMessages,
    })
    return null
  }
}

const handleSocketRequest = (socket: Socket, ...roles: string[]) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.query.token ||
      socket.handshake.headers.authorization

    let jwtToken = extractToken(token)

    // Verify token
    const verifiedUser = jwtHelper.verifyToken(
      jwtToken,
      config.jwt.jwt_secret as Secret,
    )

    // Guard user based on roles
    if (roles.length && !roles.includes(verifiedUser.role)) {
      socket.emit(
        'socket_error',
        createErrorResponse(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this socket event",
        ),
      )
      return null
    }

    return {
      ...verifiedUser,
    }
  } catch (error) {
    handleSocketError(socket, error)
    return null
  }
}

// Helper functions
function extractToken(token: string | string[]): string {
  if (typeof token === 'string') {
    if (token.includes('{')) {
      try {
        const parsedToken = JSON.parse(token)
        return parsedToken?.token?.split(' ')[1] || parsedToken?.token || token
      } catch {
        // If parsing fails, continue with other methods
      }
    }

    if (token.startsWith('Bearer ')) {
      return token.split(' ')[1]
    }
  }
  return token as string
}

function createErrorResponse(
  statusCode: number,
  message: string,
  errorMessages?: Record<string, unknown>[],
): ErrorResponse {
  return {
    statusCode,
    error: getErrorName(statusCode),
    message,
    ...(errorMessages && { errorMessages }),
  }
}

function getErrorName(statusCode: number): string {
  switch (statusCode) {
    case StatusCodes.BAD_REQUEST:
      return 'Bad Request'
    case StatusCodes.UNAUTHORIZED:
      return 'Unauthorized'
    case StatusCodes.FORBIDDEN:
      return 'Forbidden'
    case StatusCodes.NOT_FOUND:
      return 'Not Found'
    default:
      return 'Error'
  }
}

function handleSocketError(socket: Socket, error: any): void {
  if (error instanceof ApiError) {
    socket.emit(
      'socket_error',
      createErrorResponse(error.statusCode, error.message),
    )
  } else {
    socket.emit(
      'socket_error',
      createErrorResponse(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Internal server error',
      ),
    )
  }
  logger.error(colors.red(`Socket error: ${error.message}`), error)
}

export const socketMiddleware = {
  socketAuth,
  validateEventData,
  handleSocketRequest, // Kept for backward compatibility
}
