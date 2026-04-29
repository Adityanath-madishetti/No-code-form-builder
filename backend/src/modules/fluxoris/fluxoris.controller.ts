import { Request, Response, NextFunction } from 'express';
import fluxorisService from './fluxoris.service.js';
import { FluxorisEventPayload } from './fluxoris.types.js';

export const receiveFluxorisEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = (req.body || {}) as FluxorisEventPayload;
    const signature = req.get('X-Fluxoris-Signature') || '';

    const event = await fluxorisService.storeEvent(payload, signature);

    res.status(200).json({
      ok: true,
      eventId: event._id,
      receivedAt: event.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const listFluxorisEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const filters = {
      runId: typeof req.query.run_id === 'string' ? req.query.run_id.trim() : undefined,
      formId: typeof req.query.form_id === 'string' ? req.query.form_id.trim() : undefined,
      eventType: typeof req.query.event_type === 'string' ? req.query.event_type.trim() : undefined,
    };

    const events = await fluxorisService.listEvents(filters, limit);
    res.status(200).json({ events });
  } catch (error) {
    next(error);
  }
};

export const exchangeFluxorisToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No user found in request.' });
    }

    const data = await fluxorisService.exchangeToken(req.user.uid, req.user.email);
    res.status(200).json(data);
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        upstream: error.upstream,
      });
    }
    next(error);
  }
};
