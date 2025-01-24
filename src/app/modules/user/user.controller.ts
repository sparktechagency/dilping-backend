import { Request, Response, NextFunction } from 'express';

import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from './user.interface';
import { UserServices } from './user.service';

const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

        const user = await UserServices.createUser(req.body);
        sendResponse<IUser>(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'User created successfully',
            data: user,
        })
})
export const UserController = { 
    createUser
};
