import { User } from '../app/modules/user/user.model'
import { USER_ROLES } from '../enum/user'

export const findUsersInRadius = async (
  lng: number,
  lat: number,
  radiusInKm: number,
) => {
  const radiusInRadians = radiusInKm / 6378.1 // Earth's radius in km

  const users = await User.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], radiusInRadians],
      },
    },
    role: USER_ROLES.BUSINESS,
  })

  return users
}
