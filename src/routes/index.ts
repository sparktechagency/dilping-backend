import express from 'express'

const router = express.Router()

const apiRoutes: {
  path: string
  route: any
}[] = []

apiRoutes.forEach(route => {
  router.use(route.path, route.route)
})

export default router
