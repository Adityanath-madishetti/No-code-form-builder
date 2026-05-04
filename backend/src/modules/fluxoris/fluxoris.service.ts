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

    // Forward only necessary headers
    const allowedHeaders = ['authorization', 'accept', 'user-agent'];
    const safeHeaders: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      // Forward allowlisted headers or anything starting with x- (but not x-fluxoris-)
      if (
        allowedHeaders.includes(lowerKey) ||
        (lowerKey.startsWith('x-') && !lowerKey.startsWith('x-fluxoris-'))
      ) {
        safeHeaders[lowerKey] = String(value);
      }
    }

    // Force application/json and skip ngrok warning page
    safeHeaders['content-type'] = 'application/json';
    safeHeaders['ngrok-skip-browser-warning'] = 'true';

    const isGetOrHead = ['GET', 'HEAD'].includes(method.toUpperCase());
    let stringifiedBody: string | undefined;

    if (!isGetOrHead && body) {
      if (typeof body === 'string') {
        stringifiedBody = body;
      } else if (Buffer.isBuffer(body)) {
        stringifiedBody = body.toString('utf-8');
      } else {
        stringifiedBody = JSON.stringify(body);
      }
    }

    logger.info(`Proxy request: ${method} ${url}`, {
      headers: safeHeaders,
      bodyType: typeof body,
      isBuffer: Buffer.isBuffer(body),
      bodyPreview: stringifiedBody ? stringifiedBody.slice(0, 100) : null,
    });

    const response = await fetch(url, {
      method,
      headers: safeHeaders,
      body: stringifiedBody,
    });

    const contentType = response.headers.get('content-type') || '';
    let data: any;
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => ({}));
    } else {
      const text = await response.text().catch(() => '');
      data = { _raw: text };
    }

    logger.info(`Proxy response: ${method} ${url}`, {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    });
    return {
      status: response.status,
      data,
    };
  }
}

export default new FluxorisService();
