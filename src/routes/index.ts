
import { CustomerRoutes } from '../app/modules/customer/customer.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import express, { Router } from 'express';

const router = express.Router();

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/customer', route: CustomerRoutes }
];

apiRoutes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
