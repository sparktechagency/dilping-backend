export type IEmailOrPhoneOtpVerification = {
    oneTimeCode: string
    email?: string
    phone?: string
}

export type IVerificationResponse = {
    verified: boolean
    message: string
}

export type IForgetPassword = {
    email?: string
    phone?: string
}

export type IResetPassword = {
    email?: string
    phone?: string
    newPassword: string
    confirmPassword: string
}