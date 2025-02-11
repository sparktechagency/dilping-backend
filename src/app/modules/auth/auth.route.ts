import express from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post('/login', passport.authenticate('local',{ session: false }), AuthController.login)

export const AuthRoutes = router;