import { StatusCodes } from 'http-status-codes'
import { User } from '../user/user.model'
import { Verification } from './verification.model'
import config from '../../../config'
import twilio from 'twilio'
import { IEmailOrPhoneVerification } from '../../../interfaces/emailTemplate'
import ApiError from '../../../errors/ApiError'
import { emailTemplate } from '../../../shared/emailTemplate'
import { emailHelper } from '../../../helpers/emailHelper'
import { IVerification } from './verification.interface'
import { Document } from 'mongoose'
import bcrypt from 'bcrypt'

const accountSid = config.twilio.account_sid
const authToken = config.twilio.auth_token
const twilioPhoneNumber = config.twilio.phone_number
const client = twilio(accountSid, authToken)

// Constants for rate limiting
const MAX_OTP_REQUESTS = 3
const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000  // 30 minutes in milliseconds
const RESTRICTION_DURATION_MS = 60 * 60 * 1000 // 1 hour in milliseconds

const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

const handleRateLimitingAndRestriction = async (verification: Document & IVerification, now: Date): Promise<void> => {
    const timeWindow = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS)

    // Check existing restriction
    console.log(verification.restrictionLeft, now)
    if (verification.restrictionLeft && verification.restrictionLeft > now) {
        console.log(verification.restrictionLeft, now)
        const remainingTime = Math.ceil(
            (verification.restrictionLeft.getTime() - now.getTime()) / (60 * 1000)
        )
        throw new ApiError(
            StatusCodes.TOO_MANY_REQUESTS,
            `Too many OTP requests. Please try again after ${remainingTime} minutes`
        )
    }

    // Handle rate limiting
    console.log(verification.latestRequestAt, now)
    if (verification.latestRequestAt < timeWindow) {
        // Reset count if outside window
        verification.requestCount = 1
        verification.latestRequestAt = now
        verification.restrictionLeft = null 
    } else {
        // Check if max requests reached
        if (verification.requestCount >= MAX_OTP_REQUESTS) {
            verification.restrictionLeft = new Date(now.getTime() + RESTRICTION_DURATION_MS)
            verification.requestCount = 0
            verification.latestRequestAt = now
            
            // Save the restriction immediately
            await verification.save()
            
            throw new ApiError(
                StatusCodes.TOO_MANY_REQUESTS,
                `Maximum OTP requests reached. Please try again after 1 hour`
            )
        }
        verification.requestCount += 1
        verification.latestRequestAt = now
    }

    // Save the updated verification
    await verification.save()
}

const sendOtpToEmailOrPhone = async (values: IEmailOrPhoneVerification): Promise<void> => {

        // Input validation
        if (!values?.email && !values?.phone) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Either email or phone is required')
        }

        const query = values?.email ? { email: values.email } : { phone: values.phone }
        const identifier = values?.email ? 'email' : 'phone'

        // For password reset, verify if user exists
        if (values.type === 'resetPassword') {
            const user = await User.findOne(query)
            if (!user) {
                throw new ApiError(
                    StatusCodes.NOT_FOUND,
                    `No user found with this ${identifier}`
                )
            }
            values.name = user.name // Get user's name for email template
        }

        const now = new Date()

        // Find or create verification record
        let verification = await Verification.findOne({
            ...query,
            type: values.type
        })

        if (verification) {
            // Handle rate limiting and restriction
            await handleRateLimitingAndRestriction(verification, now)
        }

        // Generate new OTP
        const oneTimeCode = generateOTP()

        // Prepare verification document
        const verificationData = {
            ...query,
            oneTimeCode: await bcrypt.hash(oneTimeCode, Number(config.bcrypt_salt_rounds)),
            type: values.type,
            expiresAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes expiry
            requestCount: verification ? verification.requestCount : 1,
            latestRequestAt: now,
            resetPassword: values.type === 'resetPassword'
        }

        // Use findOneAndUpdate with upsert for atomic operation
        await Verification.findOneAndUpdate(
            { ...query, type: values.type },
            verificationData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        // Send OTP based on delivery method
        if (values.email) {
            const emailData = values.type === 'resetPassword' 
                ? emailTemplate.resetPassword({ name: values.name, email: values.email, otp: oneTimeCode })
                : emailTemplate.createAccount({ name: values.name, email: values.email, otp: oneTimeCode })

            await emailHelper.sendEmail(emailData)
        } else if (values.phone) {
            await client.messages.create({
                body: `Your verification code is: ${oneTimeCode}. Valid for 5 minutes.`,
                to: values.phone,
                from: twilioPhoneNumber
            })
        }

    
}

export const verificationHelper = {
    sendOtpToEmailOrPhone
}