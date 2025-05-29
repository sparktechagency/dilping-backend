import { socket } from './../../utils/socket'
import { NextFunction, Request, Response } from 'express'
import { AnyZodObject, ZodEffects, ZodError } from 'zod'
import handleZodError from '../../errors/handleZodError'
import { SocketWithUser } from '../../interfaces/socket'

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
