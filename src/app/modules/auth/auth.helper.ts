import { Secret } from "jsonwebtoken"
import { jwtHelper } from "../../../helpers/jwtHelper"
import config from "../../../config"
import { Types } from "mongoose"
import { USER_ROLES } from "../../../enum/user"

const createToken =(authId: Types.ObjectId, userId: Types.ObjectId, role: string, ) =>{
    const accessToken = jwtHelper.createToken(
        { authId, ...(role !== USER_ROLES.ADMIN && {userId}), role },
        config.jwt.jwt_secret as Secret,
        config.jwt.jwt_expire_in as string
    )
    const refreshToken = jwtHelper.createToken(
        { authId, ...(role !== USER_ROLES.ADMIN && {userId}), role },
        config.jwt.jwt_refresh_secret as Secret,
        config.jwt.jwt_refresh_expire_in as string
    )


    return {accessToken, refreshToken}
   }

export const AuthHelper = {createToken}