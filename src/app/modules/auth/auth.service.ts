import { USER_STATUS } from "../../../enum/user";
import { ILoginData } from "../../../interfaces/auth";
import { IUser } from "../user/user.interface";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { Verification } from "../verification/verification.model";
const handleLoginLogic = async(payload:ILoginData, isUserExist:any) =>{
   const {status, restrictionLeft,password} = isUserExist;

   const verification = await Verification.findOne({email: isUserExist.email})
   
   if(status === USER_STATUS.RESTRICTED){
    
    if(verification?.restrictionLeft  && new Date() < verification.restrictionLeft){
        const remainingMinutes = Math.ceil(
            (verification.restrictionLeft.getTime() - Date.now()) / 60000
          );
        throw new ApiError(
            StatusCodes.TOO_MANY_REQUESTS,
            `You are restricted to login for ${remainingMinutes} minutes`
        )

        isUserExist.status = USER_STATUS.ACTIVE;
        // await isUserExist.save();
      


    }

   }

   if(status === USER_STATUS.DELETED){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No account found with this email')
   }

   const isPasswordMatched = await User.isPasswordMatched(payload.password, password);

   if(!isPasswordMatched){
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Incorrect password')
   }




}



export const AuthServices = { handleLoginLogic };