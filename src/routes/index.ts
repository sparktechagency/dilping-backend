import { UserRoutes } from '../app/modules/user/user.route';
import express, { Router } from 'express';

const router = express.Router();

const apiRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: UserRoutes },

];

apiRoutes.forEach(route => {
  router.use(route.path, route.route);
});

export default router;
