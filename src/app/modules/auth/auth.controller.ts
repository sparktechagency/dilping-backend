import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { IUser } from '../user/user.interface';
import { StatusCodes } from 'http-status-codes';
import { ILoginResponse } from '../../../interfaces/response';

const login = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as {tokens:{accessToken:string, refreshToken:string}, role:string};
    sendResponse<ILoginResponse>(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Login successful',
        data: user
    })
})


export const AuthController = { 
    login
};