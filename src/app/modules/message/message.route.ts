import express from 'express';
import { MessageController } from './message.controller';

const router = express.Router();

router.post('/', MessageController.createMessage);
router.get('/', MessageController.getAllMessages);
router.get('/:id', MessageController.getSingleMessage);
router.patch('/:id', MessageController.updateMessage);
router.delete('/:id', MessageController.deleteMessage);

export const MessageRoutes = router;
