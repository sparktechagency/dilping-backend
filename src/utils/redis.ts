import mongoose from 'mongoose'
import { IRequest } from '../app/modules/request/request.interface'
import { redisClient } from '../helpers/redis.client'
import { Offer } from '../app/modules/offer/offer.model'
import { User } from '../app/modules/user/user.model'
import { USER_ROLES } from '../enum/user'

// Grid caching constants
const GRID_SIZE = 0.1 // Degrees (~11km)
const OFFER_CACHE_TTL = 3600 // 1 hour
const USER_EXISTS_TTL = 300 // 5 minutes
const BUSINESS_GRID_TTL = 1800 // 30 minutes

// Helper: Generate grid keys covering radius
export const getGridKeys = (
  lat: number,
  lng: number,
  radius: number,
): string[] => {
  const gridSteps = Math.ceil(radius / (GRID_SIZE * 111)) + 1
  const keys = new Set<string>()

  for (let latStep = -gridSteps; latStep <= gridSteps; latStep++) {
    for (let lngStep = -gridSteps; lngStep <= gridSteps; lngStep++) {
      const gridLat =
        Math.floor(lat / GRID_SIZE) * GRID_SIZE + latStep * GRID_SIZE
      const gridLng =
        Math.floor(lng / GRID_SIZE) * GRID_SIZE + lngStep * GRID_SIZE

      if (
        Math.abs(lat - gridLat) <= radius / 111 &&
        Math.abs(lng - gridLng) * Math.cos((lat * Math.PI) / 180) <=
          radius / 111
      ) {
        keys.add(`business:grid:${gridLat.toFixed(4)}:${gridLng.toFixed(4)}`)
      }
    }
  }

  return Array.from(keys)
}

// Haversine distance (km)
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Cache final request results for UI
export const cacheRequestResults = async (
  request: IRequest,
  businesses: any[],
  offerMap: Map<string, mongoose.Types.ObjectId>,
) => {
  try {
    const cacheKey = `request:${request._id}`
    const cacheData = {
      request,
      businesses: businesses.map(b =>
        typeof b.toObject === 'function' ? b.toObject() : b,
      ),
      offers: Array.from(offerMap.entries()),
    }
    await redisClient.set(cacheKey, JSON.stringify(cacheData), {
      EX: 600, // 10 minutes
    })
  } catch (err) {
    console.warn('Failed to cache request results', err)
  }
}

// Cached default offers lookup with Redis pipeline fix
export const cachedGetDefaultOffersMap = async (
  businessIds: mongoose.Types.ObjectId[],
  session: mongoose.ClientSession,
): Promise<Map<string, mongoose.Types.ObjectId>> => {
  if (businessIds.length === 0) return new Map()

  const cacheKeys = businessIds.map(id => `offer:default:${id.toString()}`)

  try {
    const cachedOffers = (await redisClient.mGet(cacheKeys)) as (
      | string
      | null
    )[]

    const offerMap = new Map<string, mongoose.Types.ObjectId>()
    const missingIds: mongoose.Types.ObjectId[] = []

    cachedOffers.forEach((cached, index) => {
      const bid = businessIds[index]
      if (cached) {
        offerMap.set(bid.toString(), new mongoose.Types.ObjectId(cached))
      } else {
        missingIds.push(bid)
      }
    })

    if (missingIds.length > 0) {
      const offers = await Offer.find({
        business: { $in: missingIds },
        default: true,
        status: 'active',
      })
        .select('business _id')
        .session(session)
        .lean()

      const pipeline = redisClient.multi()

      offers.forEach(offer => {
        const bidStr = offer.business.toString()
        offerMap.set(bidStr, offer._id)
        // Correct .set with arguments (key, value, 'EX', ttl)
        pipeline.set(`offer:default:${bidStr}`, offer._id.toString(), {
          EX: OFFER_CACHE_TTL,
        })
      })

      await pipeline.exec()
    }

    return offerMap
  } catch (err) {
    console.warn('Error in cachedGetDefaultOffersMap, falling back', err)
    // fallback: fetch directly from DB without cache
    const offers = await Offer.find({
      business: { $in: businessIds },
      default: true,
      status: 'active',
    })
      .select('business _id')
      .session(session)
      .lean()
    return new Map(offers.map(o => [o.business.toString(), o._id]))
  }
}

// Cached user existence check
export const cachedUserExists = async (
  userId: string,
  session: mongoose.ClientSession,
): Promise<boolean> => {
  const cacheKey = `user:exists:${userId}`

  try {
    const cached = await redisClient.get(cacheKey)
    if (cached !== null) return cached === 'true'
  } catch (err) {
    console.warn('Redis error in cachedUserExists', err)
  }

  // Cache miss or error, fallback to DB
  const exists = await User.exists({ _id: userId }).session(session)

  try {
    await redisClient.set(cacheKey, exists ? 'true' : 'false', {
      EX: USER_EXISTS_TTL,
    })
  } catch (err) {
    console.warn('Redis set error in cachedUserExists', err)
  }

  return !!exists
}

// // Grid-based caching for business radius search
// export const cachedFindUsersInRadius = async (
//   lng: number,
//   lat: number,
//   radiusInKm: number,
// ) => {
//   console.log(lat, lng, radiusInKm)
//   const gridKeys = getGridKeys(lat, lng, radiusInKm)
//   try {
//     const cachedResults = (await redisClient.mGet(gridKeys)) as (
//       | string
//       | null
//     )[]
//     const allBusinesses: Record<string, any> = {}
//     const missingGridKeys: string[] = []

//     cachedResults.forEach((cached, idx) => {
//       if (cached) {
//         const businesses = JSON.parse(cached)
//         businesses.forEach((b: any) => {
//           allBusinesses[b._id.toString()] = b
//         })
//       } else {
//         missingGridKeys.push(gridKeys[idx])
//       }
//     })

//     if (missingGridKeys.length > 0) {
//       const missingGrids = await Promise.all(
//         missingGridKeys.map(async key => {
//           const parts = key.split(':')
//           if (parts.length !== 4) {
//             console.warn('Invalid grid key format:', key)
//             return []
//           }

//           const gridLat = parseFloat(parts[2])
//           const gridLng = parseFloat(parts[3])

//           if (isNaN(gridLat) || isNaN(gridLng)) {
//             console.warn(
//               `Invalid lat/lng in grid key: ${key} parsed as lat=${gridLat}, lng=${gridLng}`,
//             )
//             return [] // Skip querying DB with invalid coords
//           }

//           const halfGrid = GRID_SIZE / 2

//           const box = [
//             [gridLng - halfGrid, gridLat - halfGrid],
//             [gridLng + halfGrid, gridLat + halfGrid],
//           ]

//           try {
//             const businesses = await User.find({
//               location: {
//                 $geoWithin: { $box: box },
//               },
//               role: USER_ROLES.BUSINESS,
//             })
//               .lean()
//               .exec()

//             // Cache asynchronously, don't await to avoid blocking
//             redisClient
//               .set(key, JSON.stringify(businesses), { EX: BUSINESS_GRID_TTL })
//               .catch(e => console.warn('Failed to cache grid:', key, e))

//             return businesses
//           } catch (err) {
//             console.error('DB query failed for grid', key, err)
//             return []
//           }
//         }),
//       )

//       missingGrids.flat().forEach(b => {
//         allBusinesses[b._id.toString()] = b
//       })
//     }

//     // Filter businesses by exact distance (Haversine)
//     return Object.values(allBusinesses).filter(business => {
//       if (
//         !business.location?.coordinates ||
//         business.location.coordinates.length < 2
//       )
//         return false

//       const dist = calculateHaversineDistance(
//         lat,
//         lng,
//         business.location.coordinates[1],
//         business.location.coordinates[0],
//       )
//       return dist <= radiusInKm
//     })
//   } catch (err) {
//     console.warn('Redis error in cachedFindUsersInRadius', err)
//     // Fallback: direct DB query without caching
//     return User.find({
//       location: {
//         $geoWithin: {
//           $centerSphere: [[lng, lat], radiusInKm / 6371], // radius in radians
//         },
//       },
//       role: USER_ROLES.BUSINESS,
//     }).lean()
//   }
// }

// Configurable constants

const MAX_SEARCH_RADIUS_KM = 20 // max radius allowed for grid caching (tune this!)

export const cachedFindUsersInRadius = async (
  lng: number,
  lat: number,
  radiusInKm: number,
) => {
  // Validate inputs
  if (
    typeof lat !== 'number' ||
    isNaN(lat) ||
    typeof lng !== 'number' ||
    isNaN(lng) ||
    typeof radiusInKm !== 'number' ||
    isNaN(radiusInKm)
  ) {
    throw new Error(
      `Invalid geo params lat:${lat}, lng:${lng}, radius:${radiusInKm}`,
    )
  }

  //   // Enforce max radius limit to avoid excessive grids
  //   if (radiusInKm > MAX_SEARCH_RADIUS_KM) {
  //     console.warn(
  //       `Search radius ${radiusInKm}km exceeds max ${MAX_SEARCH_RADIUS_KM}km, falling back to DB query without caching.`,
  //     )
  //     return User.find({
  //       location: {
  //         $geoWithin: {
  //           $centerSphere: [[lng, lat], radiusInKm / 6371],
  //         },
  //       },
  //       role: USER_ROLES.BUSINESS,
  //     }).lean()
  //   }

  // Generate grid keys to cover radius
  const gridKeys = getGridKeys(lat, lng, radiusInKm)

  try {
    // Attempt to get all grid cache entries at once
    const cachedResults = (await redisClient.mGet(gridKeys)) as (
      | string
      | null
    )[]
    const allBusinesses: Record<string, any> = {}
    const missingGridKeys: string[] = []

    // Process cached entries
    cachedResults.forEach((cached, idx) => {
      if (cached) {
        const businesses = JSON.parse(cached)
        businesses.forEach((b: any) => {
          allBusinesses[b._id.toString()] = b
        })
      } else {
        missingGridKeys.push(gridKeys[idx])
      }
    })

    console.log(missingGridKeys)
    // Fetch and cache missing grids
    if (missingGridKeys.length > 0) {
      const missingGrids = await Promise.all(
        missingGridKeys.map(async key => {
          const parts = key.split(':')
          if (parts.length !== 4) {
            console.warn('Invalid grid key format:', key)
            return []
          }

          const gridLat = parseFloat(parts[2])
          const gridLng = parseFloat(parts[3])

          if (isNaN(gridLat) || isNaN(gridLng)) {
            console.warn(
              `Invalid lat/lng in grid key: ${key} parsed as lat=${gridLat}, lng=${gridLng}`,
            )
            return []
          }

          const halfGrid = GRID_SIZE / 2
          const box = [
            [gridLng - halfGrid, gridLat - halfGrid],
            [gridLng + halfGrid, gridLat + halfGrid],
          ]

          try {
            const businesses = await User.find({
              location: {
                $geoWithin: { $box: box },
              },
              role: USER_ROLES.BUSINESS,
            })
              .lean()
              .exec()

            if (businesses.length > 0) {
              // Only cache grids that have businesses to save memory
              redisClient
                .set(key, JSON.stringify(businesses), { EX: BUSINESS_GRID_TTL })
                .catch(e => console.warn('Failed to cache grid:', key, e))
            } else {
              // Optionally log empty grid cache skips for monitoring
              // console.info(`Skipping cache for empty grid ${key}`)
            }

            return businesses
          } catch (err) {
            console.error('DB query failed for grid', key, err)
            return []
          }
        }),
      )

      // Merge newly fetched businesses
      missingGrids.flat().forEach(b => {
        allBusinesses[b._id.toString()] = b
      })
    }

    // Filter businesses within exact radius (Haversine)
    return Object.values(allBusinesses).filter(business => {
      if (
        !business.location?.coordinates ||
        business.location.coordinates.length < 2
      )
        return false

      const dist = calculateHaversineDistance(
        lat,
        lng,
        business.location.coordinates[1],
        business.location.coordinates[0],
      )
      return dist <= radiusInKm
    })
  } catch (err) {
    console.warn('Redis error in cachedFindUsersInRadius', err)
    // Fallback: direct DB query without caching
    return User.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInKm / 6371],
        },
      },
      role: USER_ROLES.BUSINESS,
    }).lean()
  }
}
