import { USER_STATUS } from "../../../enum/user";
import { ILoginData } from "../../../interfaces/auth";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { Verification } from "../verification/verification.model";





const handleLoginLogic = async(payload:ILoginData, isUserExist:any) =>{
    const {status, restrictionLeftAt,password, wrongLoginAttempts, verified} = isUserExist;
    
    const verification = await Verification.findOne({email: isUserExist.email})
    
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
    await User.findByIdAndUpdate(isUserExist._id, { $set: { restrictionLeftAt: null, wrongLoginAttempts: 0, status: USER_STATUS.ACTIVE } })
    

   }

   const isPasswordMatched = await User.isPasswordMatched(payload.password, password);

   if(!isPasswordMatched){

    isUserExist.wrongLoginAttempts = wrongLoginAttempts + 1;

    if(isUserExist.wrongLoginAttempts >= 5){
        isUserExist.status = USER_STATUS.RESTRICTED;
        isUserExist.restrictionLeftAt = new Date(Date.now() + 10 * 60 * 1000); // restriction for 10 minutes
    }

    await User.findByIdAndUpdate(isUserExist._id, {
        $set: {
            status: isUserExist.status,
            restrictionLeftAt: isUserExist.restrictionLeftAt,
        }
    })
    
    
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect password')
   }


}



export const AuthServices = { handleLoginLogic };