import fs from 'fs'
import path from 'path'

function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
      index === 0 ? match.toUpperCase() : match.toLowerCase(),
    )
    .replace(/\s+/g, '')
}

// New interface to represent a field with its type
// Enhanced interface to represent a field with its type, reference, and required/optional status
interface FieldDefinition {
  name: string
  type: string
  ref?: string
  isRequired?: boolean
  isOptional?: boolean
}

function parseFieldDefinitions(args: string[]): FieldDefinition[] {
  // Skip the first two arguments (node and script name)
  const fieldArgs = args.slice(3)

  const fields: FieldDefinition[] = []

  fieldArgs.forEach(arg => {
    // Split by colon to get name, type, and optional reference
    const parts = arg.split(':')
    if (parts.length >= 2) {
      let name = parts[0].trim()
      const type = parts[1].trim()
      const ref = parts.length > 2 ? parts[2].trim() : undefined

      // Check for optional marker (?)
      const isOptional = name.endsWith('?')
      if (isOptional) {
        name = name.slice(0, -1) // Remove the ? from the name
      }

      // Check for required marker (!)
      const isRequired = name.endsWith('!')
      if (isRequired) {
        name = name.slice(0, -1) // Remove the ! from the name
      }

      fields.push({ name, type, ref, isRequired, isOptional })
    }
  })

  return fields
}

function generateInterfaceContent(
  camelCaseName: string,
  fields: FieldDefinition[],
): string {
  let interfaceContent = `import { Model, Types } from 'mongoose';\n\nexport type I${camelCaseName} = {\n`

  // Add fields to interface
  if (fields.length > 0) {
    fields.forEach(field => {
      let tsType = 'string' // Default type

      // Map common MongoDB types to TypeScript types
      switch (field.type.toLowerCase()) {
        case 'string':
          tsType = 'string'
          break
        case 'number':
          tsType = 'number'
          break
        case 'boolean':
          tsType = 'boolean'
          break
        case 'date':
          tsType = 'Date'
          break
        case 'array':
          // If it's an array with a reference, use ObjectId[]
          tsType = field.ref ? `Types.ObjectId[]` : 'any[]'
          break
        case 'object':
          tsType = 'Record<string, any>'
          break
        case 'objectid':
        case 'id':
          tsType = 'Types.ObjectId'
          break
        default:
          tsType = 'any'
      }

      // Add optional marker to the interface field if needed
      const optionalMarker = field.isOptional ? '?' : ''
      interfaceContent += `  ${field.name}${optionalMarker}: ${tsType};\n`
    })
  } else {
    interfaceContent += '  // Define the interface for ${camelCaseName} here\n'
  }

  interfaceContent += `};\n\nexport type ${camelCaseName}Model = Model<I${camelCaseName}>;\n`

  return interfaceContent
}

function generateModelContent(
  camelCaseName: string,
  folderName: string,
  fields: FieldDefinition[],
): string {
  let modelContent = `import { Schema, model } from 'mongoose';\nimport { I${camelCaseName}, ${camelCaseName}Model } from './${folderName}.interface'; \n\nconst ${folderName}Schema = new Schema<I${camelCaseName}, ${camelCaseName}Model>({\n`

  // Add fields to schema
  if (fields.length > 0) {
    fields.forEach(field => {
      let schemaType = 'String' // Default type
      let additionalProps = ''

      // Map to Mongoose schema types
      switch (field.type.toLowerCase()) {
        case 'string':
          schemaType = 'String'
          break
        case 'number':
          schemaType = 'Number'
          break
        case 'boolean':
          schemaType = 'Boolean'
          break
        case 'date':
          schemaType = 'Date'
          break
        case 'array':
          if (field.ref) {
            // Array of references
            schemaType = '[Schema.Types.ObjectId]'
            additionalProps = `, ref: '${field.ref}'`
          } else {
            schemaType = '[Schema.Types.Mixed]'
          }
          break
        case 'object':
          schemaType = 'Schema.Types.Mixed'
          break
        case 'objectid':
        case 'id':
          schemaType = 'Schema.Types.ObjectId'
          additionalProps = field.ref ? `, ref: '${field.ref}'` : ''
          break
        default:
          schemaType = 'String'
      }

      // Add required property if marked as required
      if (field.isRequired) {
        additionalProps += ', required: true'
      }

      modelContent += `  ${field.name}: { type: ${schemaType}${additionalProps} },\n`
    })
  } else {
    modelContent += '  // Define schema fields here\n'
  }

  modelContent += `}, {\n  timestamps: true\n});\n\nexport const ${camelCaseName} = model<I${camelCaseName}, ${camelCaseName}Model>('${camelCaseName}', ${folderName}Schema);\n`

  return modelContent
}

// Add the Templates type definition
type Templates = {
  interface: string
  model: string
  controller: string
  service: string
  route: string
  validation: string
  constants: string
}

function createModule(name: string, fields: FieldDefinition[]): void {
  const camelCaseName = toCamelCase(name)
  const folderName = camelCaseName.toLowerCase()
  const folderPath = path.join(__dirname, 'app', 'modules', folderName)

  // Check if the folder already exists
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath)
    console.log(`Created folder: ${folderName}`)
  } else {
    console.log(`Folder ${folderName} already exists.`)
    return
  }

  const templates: Templates = {
    interface: generateInterfaceContent(camelCaseName, fields),
    model: generateModelContent(camelCaseName, folderName, fields),
    controller: `import { Request, Response, NextFunction } from 'express';\nimport { ${camelCaseName}Services } from './${folderName}.service';\n\nexport const ${camelCaseName}Controller = { };\n`,
    service: `import { ${camelCaseName}Model } from './${folderName}.interface';\n\nexport const ${camelCaseName}Services = { };\n`,
    route: `import express from 'express';\nimport { ${camelCaseName}Controller } from './${folderName}.controller';\n\nconst router = express.Router();\n \n\nexport const ${camelCaseName}Routes = router;\n`,
    validation: `import { z } from 'zod';\n\nexport const ${camelCaseName}Validations = {  };\n`,
    constants: `export const ${camelCaseName.toUpperCase()}_CONSTANT = 'someValue';\n`,
  }

  Object.entries(templates).forEach(([key, content]) => {
    const filePath = path.join(folderPath, `${folderName}.${key}.ts`)
    // Fix the type issue by ensuring content is a string
    fs.writeFileSync(filePath, content as string)
    console.log(`Created file: ${filePath}`)
  })

  // Add the new module to the central `apiRoutes` array
  updateRouterFile(folderName, camelCaseName)
}

// Get the module name and field definitions from command line arguments
const moduleName: string | undefined = process.argv[2]
if (!moduleName) {
  console.log(
    'Please provide a module name and optional field definitions, e.g.:\n' +
      'node gm.ts UserProfile name!:string age:number isActive:boolean description?:string\n' +
      'node gm.ts Product name!:string price!:number categories:array:Category owner?:objectid:User\n' +
      'Available types: string, number, boolean, date, array, object, objectid\n' +
      'Use ! after field name to mark as required, ? to mark as optional',
  )
} else {
  const fields = parseFieldDefinitions(process.argv)
  createModule(moduleName, fields)
}

/**
 * Updates the central router file by adding a new module route import and entry.
 *
 * @param folderName - The name of the folder/module (in lowercase or kebab-case).
 * @param camelCaseName - The camelCase name of the module (used for route import/export).
 */
function updateRouterFile(folderName: string, camelCaseName: string): void {
  const routerPath = path.join(__dirname, 'routes', 'index.ts')
  const routeImport = `import { ${camelCaseName}Routes } from '../app/modules/${folderName}/${folderName}.route';`
  const routeEntry = `{ path: '/${folderName}', route: ${camelCaseName}Routes }`

  let routerFileContent = fs.readFileSync(routerPath, 'utf-8')

  // Check if the import statement is already present
  if (!routerFileContent.includes(routeImport)) {
    routerFileContent = `${routeImport}\n${routerFileContent}`
  }

  // Find the `apiRoutes` array and update it
  const apiRoutesRegex =
    /const apiRoutes: \{ path: string; route: Router \}\[] = \[(.*?)\]/s
  const match = routerFileContent.match(apiRoutesRegex)

  if (match) {
    const currentRoutes = match[1].trim()
    if (!currentRoutes.includes(routeEntry)) {
      const updatedRoutes = currentRoutes
        ? `${currentRoutes}\n  ${routeEntry}`
        : `${routeEntry}`
      routerFileContent = routerFileContent.replace(
        apiRoutesRegex,
        `const apiRoutes: { path: string; route: Router }[] = [\n  ${updatedRoutes}\n]`,
      )
    }
  } else {
    console.error(
      'Failed to find apiRoutes array. Ensure the index.ts file has a properly defined apiRoutes array.',
    )
    return
  }

  // Write the updated content back to the `index.ts` file
  fs.writeFileSync(routerPath, routerFileContent, 'utf-8')
  console.log(`✅ Added route for ${camelCaseName} to central router.`)
}
