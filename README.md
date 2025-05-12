# deal-ping

> A modern and scalable software application.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/your/repo
cd deal-ping

# Install dependencies
npm install

# Start the server
npm run dev
```

## 🧾 Project Structure

### SRC

| File          | Description                       |
| ------------- | --------------------------------- |
| `app.ts`      | Main app setup and configuration. |
| `generate.ts` | General source file.              |
| `server.ts`   | HTTP server bootstrap file.       |

### CONFIG

| File       | Description          |
| ---------- | -------------------- |
| `index.ts` | General source file. |

### ENUM

| File      | Description          |
| --------- | -------------------- |
| `user.ts` | General source file. |

### ERRORS

| File                       | Description          |
| -------------------------- | -------------------- |
| `ApiError.ts`              | General source file. |
| `handleCastError.ts`       | General source file. |
| `handleValidationError.ts` | General source file. |
| `handleZodError.ts`        | General source file. |

### HELPERS

| File                    | Description          |
| ----------------------- | -------------------- |
| `emailHelper.ts`        | General source file. |
| `jwtHelper.ts`          | General source file. |
| `notificationHelper.ts` | General source file. |
| `paginationHelper.ts`   | General source file. |
| `socketHelper.ts`       | General source file. |

### INTERFACES

| File               | Description                                    |
| ------------------ | ---------------------------------------------- |
| `auth.ts`          | General source file.                           |
| `email.ts`         | General source file.                           |
| `emailTemplate.ts` | General source file.                           |
| `error.ts`         | Error classes and error handling.              |
| `error.types.ts`   | TypeScript interfaces or types for interfaces. |
| `pagination.ts`    | General source file.                           |
| `response.ts`      | General source file.                           |
| `verification.ts`  | General source file.                           |

### ROUTES

| File       | Description          |
| ---------- | -------------------- |
| `index.ts` | General source file. |

### SHARED

| File               | Description          |
| ------------------ | -------------------- |
| `catchAsync.ts`    | General source file. |
| `emailTemplate.ts` | General source file. |
| `logger.ts`        | General source file. |
| `morgan.ts`        | General source file. |
| `pick.ts`          | General source file. |
| `sendResponse.ts`  | General source file. |
| `unlinkFile.ts`    | General source file. |

### UTILS

| File        | Description          |
| ----------- | -------------------- |
| `crypto.ts` | General source file. |
| `socket.ts` | General source file. |

### MIDDLEWARE

| File                    | Description          |
| ----------------------- | -------------------- |
| `auth.ts`               | General source file. |
| `fileUploadHandler.ts`  | General source file. |
| `globalErrorHandler.ts` | General source file. |
| `processReqBody.ts`     | General source file. |
| `validateRequest.ts`    | General source file. |

### IMAGE

| File              | Description                            |
| ----------------- | -------------------------------------- |
| `imageResizer.ts` | General source file.                   |
| `s3helper.ts`     | Utility functions used across modules. |

### AUTH

| File                 | Description                               |
| -------------------- | ----------------------------------------- |
| `auth.helper.ts`     | Utility functions used across modules.    |
| `auth.interface.ts`  | TypeScript interfaces or types for auth.  |
| `auth.route.ts`      | API routes and endpoint mapping for auth. |
| `auth.validation.ts` | Validation logic for auth inputs.         |
| `common.ts`          | General source file.                      |

### CATEGORY

| File                     | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `category.constants.ts`  | General source file.                                         |
| `category.controller.ts` | Handles HTTP requests and responses for the category module. |
| `category.interface.ts`  | TypeScript interfaces or types for category.                 |
| `category.model.ts`      | Schema definitions and database model for category.          |
| `category.route.ts`      | API routes and endpoint mapping for category.                |
| `category.service.ts`    | Business logic and operations for category.                  |
| `category.validation.ts` | Validation logic for category inputs.                        |

### CUSTOMER

| File                     | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| `customer.constants.ts`  | General source file.                                         |
| `customer.controller.ts` | Handles HTTP requests and responses for the customer module. |
| `customer.interface.ts`  | TypeScript interfaces or types for customer.                 |
| `customer.model.ts`      | Schema definitions and database model for customer.          |
| `customer.route.ts`      | API routes and endpoint mapping for customer.                |
| `customer.service.ts`    | Business logic and operations for customer.                  |
| `customer.validation.ts` | Validation logic for customer inputs.                        |

### NOTIFICATIONS

| File                          | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `notifications.controller.ts` | Handles HTTP requests and responses for the notifications module. |
| `notifications.interface.ts`  | TypeScript interfaces or types for notifications.                 |
| `notifications.model.ts`      | Schema definitions and database model for notifications.          |
| `notifications.route.ts`      | API routes and endpoint mapping for notifications.                |
| `notifications.service.ts`    | Business logic and operations for notifications.                  |

### PUBLIC

| File                   | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `public.controller.ts` | Handles HTTP requests and responses for the public module. |
| `public.interface.ts`  | TypeScript interfaces or types for public.                 |
| `public.model.ts`      | Schema definitions and database model for public.          |
| `public.route.ts`      | API routes and endpoint mapping for public.                |
| `public.service.ts`    | Business logic and operations for public.                  |
| `public.validation.ts` | Validation logic for public inputs.                        |

### OFFER

| File                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `offer.constants.ts`  | General source file.                                      |
| `offer.controller.ts` | Handles HTTP requests and responses for the offer module. |
| `offer.interface.ts`  | TypeScript interfaces or types for offer.                 |
| `offer.model.ts`      | Schema definitions and database model for offer.          |
| `offer.route.ts`      | API routes and endpoint mapping for offer.                |
| `offer.service.ts`    | Business logic and operations for offer.                  |
| `offer.validation.ts` | Validation logic for offer inputs.                        |

### SUBCATEGORY

| File                        | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `subcategory.constants.ts`  | General source file.                                            |
| `subcategory.controller.ts` | Handles HTTP requests and responses for the subcategory module. |
| `subcategory.interface.ts`  | TypeScript interfaces or types for subcategory.                 |
| `subcategory.model.ts`      | Schema definitions and database model for subcategory.          |
| `subcategory.route.ts`      | API routes and endpoint mapping for subcategory.                |
| `subcategory.service.ts`    | Business logic and operations for subcategory.                  |
| `subcategory.validation.ts` | Validation logic for subcategory inputs.                        |

### TOKEN

| File                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `token.constants.ts`  | General source file.                                      |
| `token.controller.ts` | Handles HTTP requests and responses for the token module. |
| `token.interface.ts`  | TypeScript interfaces or types for token.                 |
| `token.model.ts`      | Schema definitions and database model for token.          |
| `token.route.ts`      | API routes and endpoint mapping for token.                |
| `token.service.ts`    | Business logic and operations for token.                  |
| `token.validation.ts` | Validation logic for token inputs.                        |

### USER

| File                 | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `user.constants.ts`  | General source file.                                     |
| `user.controller.ts` | Handles HTTP requests and responses for the user module. |
| `user.interface.ts`  | TypeScript interfaces or types for user.                 |
| `user.model.ts`      | Schema definitions and database model for user.          |
| `user.route.ts`      | API routes and endpoint mapping for user.                |
| `user.service.ts`    | Business logic and operations for user.                  |
| `user.validation.ts` | Validation logic for user inputs.                        |

### CUSTOM.AUTH

| File                        | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `custom.auth.controller.ts` | Handles HTTP requests and responses for the custom.auth module. |
| `custom.auth.service.ts`    | Business logic and operations for custom.auth.                  |

### PASSPORT.AUTH

| File                          | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `passport.auth.controller.ts` | Handles HTTP requests and responses for the passport.auth module. |
| `passport.auth.service.ts`    | Business logic and operations for passport.auth.                  |

### CONFIG

| File          | Description          |
| ------------- | -------------------- |
| `passport.ts` | General source file. |

## 📄 License

Licensed under the **ISC** License.

## 📫 Contact

Author: Asaduzzaman
