import express from 'express';
import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import { MessageController } from './message.controller';


const router = express.Router();

router.get(
  '/:chatId',
  auth(USER_ROLES.USER, USER_ROLES.BUSINESS),
  MessageController.getMessageByChat,
)


export const MessageRoutes = router;
