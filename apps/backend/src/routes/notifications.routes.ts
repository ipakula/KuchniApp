import { Router } from 'express';
import * as notificationsController from '../controllers/notifications.controller';

const router = Router();

router.get('/', notificationsController.getNotifications);
router.post('/read-all', notificationsController.markAllRead);
router.post('/:id/read', notificationsController.markRead);

export default router;
