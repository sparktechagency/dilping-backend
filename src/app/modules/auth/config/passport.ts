import passport from "passport";
import { User } from "../../user/user.model";
import {Strategy as LocalStrategy} from 'passport-local'
import { USER_STATUS } from "../../../../enum/user";

import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcrypt';
import { AuthServices } from "../auth.service";

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField:'password'
}, async (email:string, password:string, done:Function) => {

    try{
        const isUserExist = await User.findOne({ email, status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } }).select('+password');
        if(!isUserExist){
            return done(null, false, { message: 'No user found with this email.' });
        }

        await  AuthServices.handleLoginLogic({email, password}, isUserExist);
        return done(null, isUserExist);
    }catch(err){
        return done(err);
    }

}))


export default passport;