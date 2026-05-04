import { Request, Response, NextFunction } from 'express';
import fluxorisService from './fluxoris.service.js';
import { FluxorisEventPayload } from './fluxoris.types.js';
import { logger } from '@/shared/logger/index.js';

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
    logger.info(`Received exchange-token request for user: ${req.user?.uid}`);
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

export const proxyFluxorisRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Express 5 {*path} wildcard — param is named 'path'
    const wildcardPath = (req.params as Record<string, string>).path || (req.params as Record<string, string>)[0] || '';
    const queryString = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    const path = '/' + wildcardPath + queryString;

    const { method, headers, body } = req;
    const result = await fluxorisService.proxyRequest(method, path, headers as Record<string, any>, body);
    res.status(result.status).json(result.data);
  } catch (error) {
    next(error);
  }
};
