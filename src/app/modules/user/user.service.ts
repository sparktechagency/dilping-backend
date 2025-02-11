import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IUser } from './user.interface';
import { User } from './user.model';
import { verificationHelper } from '../verification/verification.utils';



const createUser = async (payload:IUser):Promise<IUser | null> =>{
    const session = await User.startSession();
    session.startTransaction();

    try {
        const user = await User.create([payload], { session });
        if(!user){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
        }

        // if user is created, send a verification email or sms
        // await verificationHelper.sendOtpToEmailOrPhone({
        //     name: user[0].name,
        //     email: user[0].email,
        //     // phone: user[0].phone,
        //     type: 'createAccount'
        // })

        await session.commitTransaction();
        await session.endSession();
        return user[0];
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}


export const UserServices = { createUser};
