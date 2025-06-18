import express from 'express';
import { USER_ROLES } from '../../../enum/user';
import auth from '../../middleware/auth';
import { MessageController } from './message.controller';

import { MessageValidations } from './message.validation';
import validateRequest from '../../middleware/validateRequest';
import { fileAndBodyProcessorUsingDiskStorage } from '../../middleware/processReqBody';


const router = express.Router();

router.get(
  '/:chatId',
  auth(USER_ROLES.USER, USER_ROLES.BUSINESS),
  MessageController.getMessageByChat,
)

router.post(
  '/:chatId',
  auth(USER_ROLES.USER, USER_ROLES.BUSINESS),
  fileAndBodyProcessorUsingDiskStorage(),
  validateRequest(MessageValidations.create),
  MessageController.sendMessage,
)

router.patch(
  '/:chatId',
  auth(USER_ROLES.USER, USER_ROLES.BUSINESS),
  MessageController.enableChat,
)


export const MessageRoutes = router;
