import passport from "passport";
import { User } from "../../user/user.model";
import {Strategy as LocalStrategy} from 'passport-local'
import { USER_ROLES, USER_STATUS } from "../../../../enum/user";

import { StatusCodes } from "http-status-codes";
import bcrypt from 'bcrypt';
import { AuthServices } from "../auth.service";
import { AuthHelper } from "../auth.helper";
import { Customer } from "../../customer/customer.model";

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

        //create access and refresh token
        let userId;

        if(isUserExist.role === USER_ROLES.CUSTOMER) userId = await Customer.getCustomerId(isUserExist._id);

        const tokens =  AuthHelper.createToken(isUserExist._id, userId!, isUserExist.role)
        return done(null, {tokens,role:isUserExist.role});
    }catch(err){
        return done(err);
    }

}))


export default passport;