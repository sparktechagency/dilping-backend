import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IUser, UserModel } from './user.interface';
import { User } from './user.model';

const createUser = async (payload:IUser):Promise<IUser | null> =>{
    const session = await User.startSession();
    session.startTransaction();
    try {
        const user = await User.create([payload], { session });
        if(!user){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create user');
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
