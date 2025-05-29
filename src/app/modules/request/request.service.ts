import { SocketWithUser } from '../../../interfaces/socket'
import { IRequest } from './request.interface'

const createRequest = async (socket: SocketWithUser, data: IRequest) => {
  console.log(socket.user, data)
}

export const RequestService = {
  createRequest,
}
