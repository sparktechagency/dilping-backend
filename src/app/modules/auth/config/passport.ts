import passport from "passport";
import { User } from "../../user/user.model";
import {Strategy as LocalStrategy} from 'passport-local'
import { USER_ROLES, USER_STATUS } from "../../../../enum/user";

import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcrypt';
import { AuthServices } from "../auth.service";
import { AuthHelper } from "../auth.helper";
import { Customer } from "../../customer/customer.model";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from '../../../../config';
import { Document, Types } from "mongoose";
import { IUser } from "../../user/user.interface";

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

        let userId;
        if (isUserExist.role === USER_ROLES.CUSTOMER) {
            userId = await Customer.getCustomerId(isUserExist._id);
        }

        const tokens = AuthHelper.createToken(isUserExist._id, userId!, isUserExist.role);
        return done(null, { tokens, role: isUserExist.role });
    } catch (err) {
        return done(err);
    }
}));



passport.use(new GoogleStrategy({
    clientID: config.google.client_id!,
    clientSecret: config.google.client_secret!,
    callbackURL: config.google.callback_url
  },
  function(accessToken: string, refreshToken: string, profile: any, cb: (err: any, user?: any) => void) {
    console.log(accessToken, refreshToken, profile);
  }
))

export default passport;