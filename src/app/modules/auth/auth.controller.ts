import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../user/user.interface';
import { StatusCodes } from 'http-status-codes';

const login = catchAsync(async (req: Request, res: Response) => {
    sendResponse<IUser>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Login successful',
    })
})


export const AuthController = { 
    login
};