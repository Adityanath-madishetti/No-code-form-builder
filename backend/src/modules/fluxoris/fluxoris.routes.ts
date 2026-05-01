import { Router } from 'express';
import { verifyToken } from '@/middlewares/auth.middleware.js';
import {
  exchangeFluxorisToken,
  listFluxorisEvents,
  receiveFluxorisEvent,
} from './fluxoris.controller.js';

const router = Router();

router.post('/events', receiveFluxorisEvent);
router.get('/events', verifyToken, listFluxorisEvents);
router.post('/exchange-token', verifyToken, exchangeFluxorisToken);

export default router;
