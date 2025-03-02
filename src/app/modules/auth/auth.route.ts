import express from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post('/login', passport.authenticate('local',{ session: false }), AuthController.login)

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/auth/google/callback', passport.authenticate('google', { session: false }), AuthController.login)

export const AuthRoutes = router;