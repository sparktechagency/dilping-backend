import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken'


const createToken = (payload: object, secret: Secret, expireTime: string) => {
  return jwt.sign(payload, secret as jwt.Secret, {
    expiresIn: expireTime as SignOptions['expiresIn'],
  })
}

const verifyToken = (token: string, secret: Secret) => {
  return jwt.verify(token, secret) as JwtPayload
}

export const jwtHelper = { createToken, verifyToken }
