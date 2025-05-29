import { Socket } from 'socket.io'

export interface SocketWithUser extends Socket {
  user?: {
    authId: string
    role: string
    [key: string]: any // Allow for additional user properties
  }
}

// Standard error response format
export interface ErrorResponse {
  statusCode: number
  error: string
  message: string
  errorMessages?: Record<string, unknown>[]
}
