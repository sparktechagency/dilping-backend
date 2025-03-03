import { USER_STATUS } from "../../../enum/user";
import { ILoginData } from "../../../interfaces/auth";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../../errors/ApiError";
import { User } from "../user/user.model";
import { Customer } from "../customer/customer.model";
import { IUser } from "../user/user.interface";
import { AuthHelper } from "./auth.helper";






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
    const email = payload?.profile?.emails[0].value;

    console.log(payload,"👍👍👍👍👍👍");

    const isUserExist = await User.findOne({ email, status: { $in: [USER_STATUS.ACTIVE, USER_STATUS.RESTRICTED] } })
    if(isUserExist){
       //return only the token
       const tokens = AuthHelper.createToken(isUserExist._id, isUserExist._id, isUserExist.role);
       return { tokens };

    }

    const session = await User.startSession();
    session.startTransaction();

    const userData ={
        email,
        role: payload.role,
        profile: payload.profile.photos[0].value,
        verified: true,
        status: USER_STATUS.ACTIVE,
        appId: payload.profile.id
    }

    try {

        const user = await User.create([userData], { session });
        if(!user){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
        }

        const customer = await Customer.create([{user: user[0]._id}], {session})
        if(!customer){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create customer');
        }

        //create token 
        const tokens = AuthHelper.createToken(user[0]._id, customer[0]._id, user[0].role);

        return { tokens };
        
    } catch (error) {   
        await session.abortTransaction(session);
        session.endSession();
        throw error;
    }finally{
      await  session.endSession();
    }


}


export const AuthServices = { handleLoginLogic, handleGoogleLogin };