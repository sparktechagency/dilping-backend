import express from 'express';
import { ChatController } from './chat.controller';

const router = express.Router();

router.post('/', ChatController.createChat);
router.get('/', ChatController.getAllChats);
router.get('/:id', ChatController.getSingleChat);
router.patch('/:id', ChatController.updateChat);
router.delete('/:id', ChatController.deleteChat);

export const ChatRoutes = router;
