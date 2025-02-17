import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IUser } from './user.interface';
import { User } from './user.model';
import { verificationHelper } from '../verification/verification.utils';
import { USER_ROLES } from '../../../enum/user';
import { Customer } from '../customer/customer.model';



const createUser = async (payload:IUser):Promise<IUser | null> =>{
    const session = await User.startSession();
    session.startTransaction();

    try {
        const user = await User.create([payload], { session });
        if(!user){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
        }

        //create role based user
        if(payload.role === USER_ROLES.CUSTOMER){
            const customer = await Customer.create([{user: user[0]._id}], {session})
            if(!customer){
                throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create customer');
            }
        }


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
