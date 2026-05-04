import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '@/database/models/User.js';
import FluxorisEvent from './fluxoris.schema.js';
import { logger } from '@/shared/logger/index.js';
import {
  FluxorisConfig,
  FluxorisEventPayload,
  FluxorisExchangeResponse,
} from './fluxoris.types.js';

class FluxorisService {
  public getConfig(): FluxorisConfig {
    return {
      baseUrl:
        process.env.FLUXORIS_API_BASE_URL?.trim().replace(/\/+$/, '') ||
        'http://localhost:8000/api',
      clientId: process.env.FLUXORIS_CLIENT_ID || 'nocode_form_builder',
      audience: process.env.FLUXORIS_AUDIENCE || 'fluxoris-partner-exchange',
      sharedSecret: process.env.FLUXORIS_SHARED_SECRET || '',
    };
  }

  public async exchangeToken(
    uid: string,
    emailFromToken: string,
  ): Promise<FluxorisExchangeResponse> {
    const config = this.getConfig();
    if (!config.sharedSecret) {
      throw new Error('FLUXORIS_SHARED_SECRET is not configured.');
    }

    const currentUser = await User.findOne({ uid }).lean();
    const email = currentUser?.email || emailFromToken;
    if (!email) {
      throw new Error('No email found for current user.');
    }

    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: config.clientId,
        sub: uid || crypto.randomUUID(),
        email,
        name: currentUser?.displayName || email.split('@')[0],
        aud: config.audience,
        iat: now,
        exp: now + 300,
      },
      config.sharedSecret,
      { algorithm: 'HS256' },
    );

    const response = await fetch(`${config.baseUrl}/auth/partner/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        assertion,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.error(`Upstream error from Fluxoris: ${response.status}`, { data });
      const error: any = new Error(data?.detail || data?.error || 'Fluxoris exchange failed.');
      error.status = response.status;
      error.upstream = data;
      throw error;
    }

    return data as FluxorisExchangeResponse;
  }

  public async storeEvent(payload: FluxorisEventPayload, signature: string) {
    const eventType = payload.event_type || payload.status || payload.event || 'unknown';
    const runId = payload.run_id || payload.runId || '';
    const workflowId = payload.workflow_id || payload.workflowId || '';
    const formId = payload.form_id || payload.formId || '';

    return await FluxorisEvent.create({
      eventType,
      runId,
      workflowId,
      formId,
      signature,
      payload,
    });
  }

  public async listEvents(
    filters: { runId?: string; formId?: string; eventType?: string },
    limit = 50,
  ) {
    const query: any = {};
    if (filters.runId) query.runId = filters.runId;
    if (filters.formId) query.formId = filters.formId;
    if (filters.eventType) query.eventType = filters.eventType;

    return await FluxorisEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .lean();
  }

  public async proxyRequest(method: string, path: string, headers: Record<string, any>, body: any) {
    const config = this.getConfig();
    const url = `${config.baseUrl}${path}`;

    // Filter out host and other sensitive/incompatible headers
    const { host, connection, 'content-length': _, ...safeHeaders } = headers;

    const response = await fetch(url, {
      method,
      headers: {
        ...safeHeaders,
        'Content-Type': 'application/json',
      },
      body: ['GET', 'HEAD'].includes(method.toUpperCase()) ? undefined : JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      data,
    };
  }
}

export default new FluxorisService();
