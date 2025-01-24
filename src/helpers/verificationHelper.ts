import { StatusCodes } from "http-status-codes"
import { User } from "../app/modules/user/user.model"
import { IEmailOrPhoneVerification } from "../interfaces/emailTemplate"
import { emailTemplate } from "../shared/emailTemplate"
import { emailHelper } from "./emailHelper"
import ApiError from "../errors/ApiError"
import { Verification } from "../app/modules/verification/verification.model"
import config from "../config"
import twilio from "twilio"

const accountSid = config.twilio.account_sid;
const authToken = config.twilio.auth_token;
const twilioPhoneNumber = config.twilio.phone_number;
const client = twilio(accountSid, authToken);

const sendOtpToEmailOrPhone = async (values: IEmailOrPhoneVerification): Promise<void> => {
    if(!values?.email && !values?.phone) throw new ApiError(StatusCodes.BAD_REQUEST, `${values.email ? 'Email' : 'Phone'} is required`)
    
    const query = values?.email ? { email: values.email } : { phone: values.phone }

    // For password reset, verify if user exists
    if(values.type === 'resetPassword') {
        const user = await User.findOne(query)
        if(!user) {
            throw new ApiError(StatusCodes.NOT_FOUND, `User not found with ${values.email ? 'Email' : 'Phone'}`)
        }
        values.name = user.name // Get user's name for email template
    }
    
    //check if otp already sent within the last 15 minutes
    const existingOtp = await Verification.findOne({
        ...query,
        type: values.type
    })

    if(existingOtp) {
        const timeElapsed = Date.now() - new Date(existingOtp.latestRequestAt!).getTime();
        const fiveMinutesInMs = 5 * 60 * 1000;

        if(timeElapsed < fiveMinutesInMs && existingOtp.requestCount! >= 3) {
            throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Too many requests, please try again later')
        }

        if(timeElapsed >= fiveMinutesInMs) {
            existingOtp.requestCount = 1;
            existingOtp.latestRequestAt = new Date()
        }else{
            existingOtp.requestCount += 1
        }

        await existingOtp.save()
    }

    //generate otp 
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    //save the otp in the db
    const verificationData = {
        oneTimeCode: otp,
        ...(values.email && { email: values.email }),
        ...(values.phone && { phone: values.phone }),
        requestCount: 1,
        latestRequestAt: new Date(),
        createdAt: new Date(),
        expiresAt: expiresAt,
        type: values.type,
        resetPassword: values.type === 'resetPassword'
    }

    const newOtp = existingOtp 
        ? Object.assign(existingOtp, { 
            oneTimeCode: otp, 
            expiresAt,
            latestRequestAt: new Date() 
          }) 
        : new Verification(verificationData)

    await newOtp.save()

    if(values?.email) {
        //send the otp to the email
        const otpEmailTemplate = values.type === 'createAccount' 
            ? emailTemplate.createAccount({ name: values.name, email: values.email, otp }) 
            : emailTemplate.resetPassword({ name: values.name, email: values.email, otp })
        
        await emailHelper.sendEmail(otpEmailTemplate);
    }

    if(values?.phone) {
        //send the otp to the phone
        const message = values.type === 'createAccount'
            ? `Your verification code is ${otp}. Use this to verify your account. It will expire in 5 minutes.`
            : `Your password reset code is ${otp}. Use this to reset your password. It will expire in 5 minutes.`

        await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: values.phone,
        });
    }
}

const verifyOtp = async (payload: { 
    email?: string; 
    phone?: string; 
    otp: string;
    type: 'createAccount' | 'resetPassword' 
}): Promise<boolean> => {
    if (!payload.email && !payload.phone) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Email or phone is required')
    }

    const query = {
        ...(payload.email && { email: payload.email }),
        ...(payload.phone && { phone: payload.phone }),
        type: payload.type
    }

    const verification = await Verification.findOne(query)

    if (!verification) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'No verification code found')
    }

    if (verification.oneTimeCode !== payload.otp) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid verification code')
    }

    if (new Date() > verification.expiresAt) {
        await Verification.deleteOne({ _id: verification._id })
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Verification code has expired')
    }

    // If verification successful, delete the verification document
    await Verification.deleteOne({ _id: verification._id })

    await User.findOneAndUpdate(
        { ...(payload.email && { email: payload.email }) || (payload.phone && { phone: payload.phone }) },
        { verified: true },
    )

    return true
}

export const verificationHelper = { 
    sendOtpToEmailOrPhone,
    verifyOtp
}