import { USER_STATUS } from "../../../enum/user";
import { ILoginData } from "../../../interfaces/auth";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { Customer } from "../customer/customer.model";
import { IUser } from "../user/user.interface";
import { AuthHelper } from "./auth.helper";
import { generateOtp } from "../../../utils/crypto";
import { emailHelper } from "../../../helpers/emailHelper";
import { emailTemplate } from "../../../shared/emailTemplate";
import { IResetPassword } from "./auth.interface";
import { Token } from "../token/token.model";
import config from "../../../config";

import bcrypt from 'bcrypt';


const handleLoginLogic = async(payload:ILoginData, isUserExist:any) =>{
    const {authentication, verified, status, password} = isUserExist;

    const {restrictionLeftAt, wrongLoginAttempts} = authentication;
    console.log(verified, status, restrictionLeftAt, wrongLoginAttempts)

    
    if(!verified){
        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Your email is not verified, please verify your email and try again.')
    }
    
    if(status === USER_STATUS.DELETED){
     throw new ApiError(StatusCodes.BAD_REQUEST, 'No account found with this email')
    }
   
   if(status === USER_STATUS.RESTRICTED){
    
    if(restrictionLeftAt && new Date() < restrictionLeftAt){
        const remainingMinutes = Math.ceil(
            (restrictionLeftAt.getTime() - Date.now()) / 60000
          );
        throw new ApiError(
            StatusCodes.TOO_MANY_REQUESTS,
            `You are restricted to login for ${remainingMinutes} minutes`
        )
    }



    // Handle restriction expiration
    await User.findByIdAndUpdate(isUserExist._id, { $set: { authentication: { restrictionLeftAt: null, wrongLoginAttempts: 0 },  'status': USER_STATUS.ACTIVE } })
    

   }

   const isPasswordMatched = await User.isPasswordMatched(payload.password, password);

   if(!isPasswordMatched){

    isUserExist.authentication.wrongLoginAttempts = wrongLoginAttempts + 1;

    if(isUserExist.authentication.wrongLoginAttempts >= 5){
        isUserExist.status = USER_STATUS.RESTRICTED;
        isUserExist.authentication.restrictionLeftAt = new Date(Date.now() + 10 * 60 * 1000); // restriction for 10 minutes
    }

    await User.findByIdAndUpdate(isUserExist._id, {
        $set: {
            status: isUserExist.status,
            authentication: {
                restrictionLeftAt: isUserExist.authentication.restrictionLeftAt,
                wrongLoginAttempts: isUserExist.authentication.wrongLoginAttempts
            }
        }
    })
    
    
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect password')
   }


}


const handleGoogleLogin = async (payload: IUser & { profile: any }) => {
    const {emails, photos, displayName, id} = payload.profile
    const email = emails[0].value;


    const isUserExist = await User.findOne({ email, status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } })
    if(isUserExist){
       //return only the token
       const tokens = AuthHelper.createToken(isUserExist._id, isUserExist.role);
       return { tokens };
    }

    const session = await User.startSession();
    session.startTransaction();

    const userData ={
        email:emails[0].value,
        profile: photos[0].value,
        name: displayName,
        verified: true,
        password: id,
        status: USER_STATUS.ACTIVE,
        appId: id,
        role: payload.role
    }

    try {

        const user = await User.create([userData], { session });
        if(!user){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
        }

        //create token 
        const tokens = AuthHelper.createToken(user[0]._id,  user[0].role);

        
        await session.commitTransaction();
        await session.endSession();
        
        return { tokens };
    } catch (error) {   
        await session.abortTransaction(session);
        session.endSession();
        throw error;
    }finally{
      await  session.endSession();
    }


}


const forgetPassword = async(email?:string, phone?:string) =>{
    const query = email ? { email:email } : { phone:phone };
    const isUserExist = await User.findOne({ ...query, status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } })

    if(!isUserExist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'No account found with this email or phone')
    }

    const otp = generateOtp();
    const authentication = {
        oneTimeCode: otp,
        resetPassword: true,
        latestRequestAt: new Date(),
        requestCount: 1,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        authType: 'resetPassword'
    }
    
    
    
    //send otp to user
    if(email){
        const forgetPasswordEmailTemplate = emailTemplate.resetPassword({
            name: isUserExist.name as string,
            email: isUserExist.email as string,
            otp,
        })
        emailHelper.sendEmail(forgetPasswordEmailTemplate)
    }
    
    if(phone){
        //implement this feature using twilio/aws sns   
    }
    
    await User.findByIdAndUpdate(isUserExist._id, { $set: { authentication } });
    return { message: 'OTP sent successfully' };
    
}


const resetPassword = async(resetToken:string, payload:IResetPassword)=>{

    const {newPassword, confirmPassword} = payload;
    if(newPassword !== confirmPassword){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Passwords do not match')
    }

    const isTokenExist = await Token.findOne({ token: resetToken }).lean();
    if(!isTokenExist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You don\'t have authorization to reset your password')
    }

    

    const isUserExist = await User.findById(isTokenExist.user).select('+authentication').lean();
    if(!isUserExist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Something went wrong, please try again.')
    }

    const {authentication} = isUserExist;
    if(!authentication?.resetPassword){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'You don\'t have permission to change the password. Please click again to "Forgot Password"')
    
    }

    const isTokenValid = authentication?.expiresAt! > new Date();
    if(!isTokenValid){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Your reset token has expired, please try again.')
    }

    const hashPassword = bcrypt.hash(newPassword, config.bcrypt_salt_rounds as string);
    const updatedUserData = {
        password: hashPassword,
        authentication: {
            resetPassword: false
        }
    }

    await User.findByIdAndUpdate(isUserExist._id, { $set: updatedUserData }, { new: true });
    
    return { message: 'Password reset successfully' };
}



const verifyAccount = async(email?:string, phone?:string)=>{
    //verify fo new user

    const query = email ? { email:email } : { phone:phone };

    const isUserExist = await User.findOne({ ...query, status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } }).select('+authentication').lean();
    if(!isUserExist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'No account found with this email or phone')
    }

    //do the rest
    //verify for existing user
}


export const AuthServices = { handleLoginLogic, handleGoogleLogin, forgetPassword, resetPassword };