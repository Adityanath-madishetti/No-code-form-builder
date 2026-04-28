import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import FluxorisEvent from "../models/FluxorisEvent.js";

function getFluxorisConfig() {
  const baseUrl =
    process.env.FLUXORIS_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    "http://localhost:8000/api";
  const clientId = process.env.FLUXORIS_CLIENT_ID || "nocode_form_builder";
  const audience =
    process.env.FLUXORIS_AUDIENCE || "fluxoris-partner-exchange";
  const sharedSecret = process.env.FLUXORIS_SHARED_SECRET || "";
  return { baseUrl, clientId, audience, sharedSecret };
}

export const receiveFluxorisEvent = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const eventType =
      payload.event_type || payload.status || payload.event || "unknown";
    const runId = payload.run_id || payload.runId || "";
    const workflowId = payload.workflow_id || payload.workflowId || "";
    const formId = payload.form_id || payload.formId || "";
    const signature = req.get("X-Fluxoris-Signature") || "";

    const event = await FluxorisEvent.create({
      eventType,
      runId,
      workflowId,
      formId,
      signature,
      payload,
    });

    res.status(200).json({
      ok: true,
      eventId: event._id,
      receivedAt: event.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

export const listFluxorisEvents = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const query = {};
    if (typeof req.query.run_id === "string" && req.query.run_id.trim()) {
      query.runId = req.query.run_id.trim();
    }
    if (typeof req.query.form_id === "string" && req.query.form_id.trim()) {
      query.formId = req.query.form_id.trim();
    }
    if (typeof req.query.event_type === "string" && req.query.event_type.trim()) {
      query.eventType = req.query.event_type.trim();
    }

    const events = await FluxorisEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.status(200).json({ events });
  } catch (error) {
    next(error);
  }
};

export const exchangeFluxorisToken = async (req, res, next) => {
  try {
    const { baseUrl, clientId, audience, sharedSecret } = getFluxorisConfig();
    if (!sharedSecret) {
      return res.status(500).json({
        error:
          "FLUXORIS_SHARED_SECRET is not configured on partner backend.",
      });
    }

    const currentUser = await User.findOne({ uid: req.user.uid }).lean();
    const email = currentUser?.email || req.user.email;
    if (!email) {
      return res.status(400).json({ error: "No email found for current user." });
    }

    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: clientId,
        sub: req.user.uid || crypto.randomUUID(),
        email,
        name: currentUser?.displayName || email.split("@")[0],
        aud: audience,
        iat: now,
        exp: now + 300,
      },
      sharedSecret,
      { algorithm: "HS256" },
    );

    const response = await fetch(`${baseUrl}/auth/partner/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        assertion,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.detail || data?.error || "Fluxoris exchange failed.",
        upstream: data,
      });
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
