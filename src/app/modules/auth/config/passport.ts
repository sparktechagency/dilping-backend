import passport from "passport";
import { User } from "../../user/user.model";
import {Strategy as LocalStrategy} from 'passport-local'
import { USER_ROLES, USER_STATUS } from "../../../../enum/user";

import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcrypt';
import { AuthServices } from "../auth.service";
import { AuthHelper } from "../auth.helper";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from '../../../../config';

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true 
}, async (req, email, password, done) => { 
    try {


        const isUserExist = await User.findOne({ 
            email, 
            status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } 
        }).select('+password +authentication');

        if (!isUserExist) {
            return done(null, false, { message: 'No user found with this email.' });
        }

        // Your existing login logic here
        await AuthServices.handleLoginLogic({ email, password }, isUserExist);

        const tokens = AuthHelper.createToken(isUserExist._id, isUserExist.role);
        return done(null, { tokens, role: isUserExist.role });
    } catch (err) {
        return done(err);
    }
}));



passport.use(new GoogleStrategy({
    clientID: config.google.client_id!,
    clientSecret: config.google.client_secret!,
    callbackURL: config.google.callback_url,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    
    req.body.profile = profile;
    req.body.role = USER_ROLES.CUSTOMER

    try {
      return done(null, req.body);
    } catch (err) {
      return done(err);
    }
  }
 
))

export default passport;