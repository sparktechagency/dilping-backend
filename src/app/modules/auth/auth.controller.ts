import catchAsync from "../../../shared/catchAsync";
import { Request, Response, NextFunction } from 'express';
import sendResponse from "../../../shared/sendResponse";
import { StatusCodes } from "http-status-codes";
import { AuthServices } from "./auth.service";

const verifyEmailOrPhoneOtp = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { oneTimeCode, email, phone } = req.body;

    const result = await AuthServices.verifyEmailOrPhoneOtp({ oneTimeCode, email, phone })
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'OTP verified successfully',
        data: result,
    })
})


const forgetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone } = req.body;

    const result = await AuthServices.forgetPassword({ email, phone })
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: result,
    })
})

const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { email, phone, newPassword, confirmPassword } = req.body;

    const result = await AuthServices.resetPassword({ email, phone, newPassword, confirmPassword })
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Password reset successfully',
        data: result,
    })
})

export const AuthController = {
    verifyEmailOrPhoneOtp,
    forgetPassword,
    resetPassword
}