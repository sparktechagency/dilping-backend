import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodEffects, ZodError } from 'zod'
import { socket } from '../../utils/socket'
import { StatusCodes } from 'http-status-codes'
import handleZodError from '../../errors/handleZodError'

const validateRequest =
  (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      })
      return next()
    } catch (error) {
      next(error)
    }
  }

export default validateRequest

export const validateSocketData = (schema: AnyZodObject, data: any) => {
  try {
    const parsedData = schema.parse(data)
    return parsedData
  } catch (error) {
    const returnableError = handleZodError(error as ZodError)
    socket.emit('error', {
      statusCode: returnableError.statusCode,
      message: returnableError.message,
      errorMessages: returnableError.errorMessages,
    })
  }
}
