import { Request, Response, NextFunction } from 'express'
import multer, { FileFilterCallback } from 'multer'
import ApiError from '../../errors/ApiError'
import { StatusCodes } from 'http-status-codes'
import path from 'path'
import fs from 'fs'

type IFolderName = 'image' | 'media' | 'doc'
interface ProcessedFiles {
  [key: string]: string | string[] | undefined
}

// Define upload configuration with maxCount information
const uploadFields = [
  { name: 'image', maxCount: 5 },
  { name: 'media', maxCount: 3 },
  { name: 'doc', maxCount: 3 },
] as const

export const fileAndBodyProcessor = () => {
  const storage = multer.memoryStorage()

  // File filter configuration
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    try {
      const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/jpg'],
        media: ['video/mp4', 'audio/mpeg'],
        doc: ['application/pdf'],
      }

      const fieldType = file.fieldname as IFolderName
      if (!allowedTypes[fieldType]?.includes(file.mimetype)) {
        return cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid file type for ${file.fieldname}`,
          ),
        )
      }
      cb(null, true)
    } catch (error) {
      cb(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'File validation failed',
        ),
      )
    }
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 10,
    },
  }).fields(uploadFields)

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async error => {
      if (error) return next(error)

      try {
        // Parse JSON data if exists
        if (req.body?.data) {
          req.body = JSON.parse(req.body.data)
        }

        // Process uploaded files
        if (req.files) {
          const processedFiles: ProcessedFiles = {}
          const fieldsConfig = new Map(
            uploadFields.map(f => [f.name, f.maxCount]),
          )

          // Process each uploaded field
          Object.entries(req.files).forEach(([fieldName, files]) => {
            const maxCount = fieldsConfig.get(fieldName as IFolderName) ?? 1

            // Generate file paths with proper filenames
            const paths = (files as Express.Multer.File[]).map(file => {
              const extension = file.mimetype.split('/')[1]
              const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
              return `/${fieldName}/${filename}`
            })

            // Store as array or single value based on maxCount
            processedFiles[fieldName] = maxCount > 1 ? paths : paths[0]
          })

          req.body = { ...req.body, ...processedFiles }
        }

        next()
      } catch (err) {
        next(err)
      }
    })
  }
}

// Utility function to generate random string
function generateRandomString(length: number = 9): string {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
}

export const fileAndBodyProcessorUsingDiskStorage = () => {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  // Configure storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const folderPath = path.join(uploadsDir, file.fieldname)
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true })
      }
      cb(null, folderPath)
    },
    filename: (req, file, cb) => {
      const extension =
        path.extname(file.originalname) || `.${file.mimetype.split('/')[1]}`
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`
      cb(null, filename)
    },
  })

  // File filter configuration
  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    try {
      const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/jpg'],
        media: ['video/mp4', 'audio/mpeg'],
        doc: ['application/pdf'],
      }

      const fieldType = file.fieldname as IFolderName
      if (!allowedTypes[fieldType]?.includes(file.mimetype)) {
        return cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid file type for ${file.fieldname}`,
          ),
        )
      }
      cb(null, true)
    } catch (error) {
      cb(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'File validation failed',
        ),
      )
    }
  }

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 10,
    },
  }).fields(uploadFields)

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async error => {
      if (error) return next(error)

      try {
        // Parse JSON data if exists
        if (req.body?.data) {
          req.body = JSON.parse(req.body.data)
        }

        // Process uploaded files
        if (req.files) {
          const processedFiles: ProcessedFiles = {}
          const fieldsConfig = new Map(
            uploadFields.map(f => [f.name, f.maxCount]),
          )

          // Process each uploaded field
          Object.entries(req.files).forEach(([fieldName, files]) => {
            const maxCount = fieldsConfig.get(fieldName as IFolderName) ?? 1

            // Get paths of saved files
            const paths = (files as Express.Multer.File[]).map(file => {
              return `/${fieldName}/${file.filename}` // This now contains the actual saved filename
            })

            // Store as array or single value based on maxCount
            processedFiles[fieldName] = maxCount > 1 ? paths : paths[0]
          })

          req.body = { ...req.body, ...processedFiles }
        }

        next()
      } catch (err) {
        next(err)
      }
    })
  }
}
