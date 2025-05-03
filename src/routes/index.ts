import { CustomerRoutes } from '../app/modules/customer/customer.route'
import { UserRoutes } from '../app/modules/user/user.route'
import { AuthRoutes } from '../app/modules/auth/auth.route'
import express, { Router } from 'express'
import { NotificationRoutes } from '../app/modules/notifications/notifications.route'
import { PublicRoutes } from '../app/modules/public/public.route'

import { SubcategoryRoutes } from '../app/modules/subcategory/subcategory.route'
import { CategoryRoutes } from '../app/modules/category/category.route'

const router = express.Router()

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/customer', route: CustomerRoutes },

  { path: '/notifications', route: NotificationRoutes },

  { path: '/public', route: PublicRoutes },

  { path: '/subcategory', route: SubcategoryRoutes },

  { path: '/category', route: CategoryRoutes },
]

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
