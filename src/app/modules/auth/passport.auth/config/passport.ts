import passport from 'passport'
import { User } from '../../../user/user.model'
import { Strategy as LocalStrategy } from 'passport-local'
import { USER_ROLES, USER_STATUS } from '../../../../../enum/user'

import { PassportAuthServices } from '../passport.auth.service'
import { AuthHelper } from '../../auth.helper'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import config from '../../../../../config'
import { StatusCodes } from 'http-status-codes'
import ApiError from '../../../../../errors/ApiError'

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const lowercaseEmail = email.toLowerCase().trim()
        const isUserExist = await User.findOne({
          email: lowercaseEmail,
          status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] },
        })
          .select('+password +authentication')
          .lean()

        if (!isUserExist) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            'No account found with this email, please sign up first.',
          )
        }

        return done(null, {
          ...isUserExist,
        })
      } catch (err) {
        return done(err)
      }
    },
  ),
)

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.client_id!,
      clientSecret: config.google.client_secret!,
      callbackURL: config.google.callback_url,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      req.body.profile = profile
      req.body.role = USER_ROLES.BUSINESS

      try {
        return done(null, req.body)
      } catch (err) {
        return done(err)
      }
    },
  ),
)

export default passport
