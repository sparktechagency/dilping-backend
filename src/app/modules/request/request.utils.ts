import { ClientSession } from 'mongoose'
import { USER_ROLES, USER_STATUS } from '../../../enum/user'
import { User } from '../user/user.model'

const getBusinessesWithingRadius = async (
  radius: number,
  latitude: number,
  longitude: number,
  session: ClientSession,
) => {
  const businesses = await User.find({
    role: USER_ROLES.BUSINESS,
    status: USER_STATUS.ACTIVE,
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius / 3963.2],
      },
    },
  }).session(session)

  return businesses
}

export const RequestUtils = {
  getBusinessesWithingRadius,
}
