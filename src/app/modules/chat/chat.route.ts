import express from 'express'
import { ChatController } from './chat.controller'
import auth from '../../middleware/auth'
import { USER_ROLES } from '../../../enum/user'

const router = express.Router()

router.post('/', ChatController.createChat)
router.get(
  '/businesses',
  auth(USER_ROLES.BUSINESS),
  ChatController.getAllChatForBusinesses,
)
router.get(
  '/user/:requestId',
  auth(USER_ROLES.USER),
  ChatController.getAllChatsForUser,
)

router.get('/:id', ChatController.getSingleChat)
router.patch('/:id', ChatController.updateChat)
router.delete('/:id', ChatController.deleteChat)

export const ChatRoutes = router
