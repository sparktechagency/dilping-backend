import { ClientSession, Types } from 'mongoose'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { User } from '../user/user.model'
import { ICategory } from '../category/category.interface'
import { ISubcategory } from '../subcategory/subcategory.interface'
import { IRequest } from './request.interface'
import { sendDataWithSocket, sendNotification } from '../../../helpers/notificationHelper'
import { IChat } from '../chat/chat.interface'
import { JwtPayload } from 'jsonwebtoken'
import { logger } from '../../../shared/logger'

const getBusinessesWithinRadius = async (
  radius: number,
  latitude: number,
  longitude: number,
  session: ClientSession,
  category: Types.ObjectId | ICategory,
  subCategories: Types.ObjectId[] | ISubcategory[],
) => {
  const businesses = await User.find({
    role: USER_ROLES.BUSINESS,
    status: USER_STATUS.ACTIVE,
    category: category,
    subCategories: { $in: subCategories },
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius / 3963.2],
      },
    },
  }).session(session)

  return businesses
}

const sendRequestNotificationsToBusinessesWithData = async (
  user: JwtPayload,
  request: IRequest,
  chats: IChat[],
) => {
  // Batch process notifications
  const notificationPromises = chats.map(chat => 
    sendNotification({
      title: request.message,
      body: `${user.name} has sent you a message, to view the message or chat please open chat list.`,
      sender: user.authId!,
      receiver: chat.participants[1].toString(),
    })
  );

  await Promise.all(notificationPromises).catch(err => 
    logger.error('Failed to send some notifications', err)
  );
};
export const RequestUtils = {
  getBusinessesWithinRadius,
  sendRequestNotificationsToBusinessesWithData,
}
