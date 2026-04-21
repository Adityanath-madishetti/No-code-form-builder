import { Groq } from "groq-sdk";
import { ActionStreamSchema } from "../utils/aiForm.schema.js";
import { z } from "zod";
import {
  generateBuilderPrompt,
  generateRouterCatalogue,
} from "../utils/schemaPromptBuilder.js";
import { getRegisteredComponentTypes } from "../registry/components.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Model identifiers ───────────────────────────────────────────────────────
const ROUTER_MODEL  = "llama-3.1-8b-instant";    // Pass 1 — fast & cheap
const BUILDER_MODEL = "llama-3.3-70b-versatile"; // Pass 2 — heavy & accurate

/**
 * ✅ Phase 1: Architecture & Dynamic Prompting  — COMPLETE
 * ✅ Phase 2: Backend Two-Pass Orchestration    — COMPLETE
 *
 * [x] 1. Component Registry       →  src/registry/components.js
 * [x] 2. Schema-to-Prompt Helper  →  src/utils/schemaPromptBuilder.js
 * [x] 3. Pass 1 — Router  (this file, runRouterPass)
 *        Model  : llama-3.1-8b-instant  (fast/cheap)
 *        Input  : user prompt + generateRouterCatalogue()
 *        Output : { componentTypes: string[], requiresLogic: boolean }
 * [x] 4. Pass 2 — Builder (this file, runBuilderPass)
 *        Model  : llama-3.3-70b-versatile
 *        System : generateBuilderPrompt(componentTypes)  ← laser-focused
 *        Output : validated ActionStream (Zod + self-healing retry loop)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO Phase 3: Frontend UX (AIGenerateButton.tsx)
 *   [ ] 5. State machine: 'idle' | 'analyzing' | 'building' | 'done'
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 3: The Frontend UX (AIGenerateButton.tsx)
 *  [ ] 5. Upgrade the Loading State
 *      Change the isGenerating boolean to a state machine: 
 *      type GenerationState = 'idle' | 'analyzing' | 'building' | 'done'.
 *      (Optional) Use Server-Sent Events (SSE) or simple sequential HTTP requests to update 
 *      the UI text from "Analyzing request..." to "Drafting structure and logic..." so the 
 *      user isn't staring at a frozen spinner.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Pass 1 — Router  (fast model)
// Job   : understand *what* is needed, NOT generate JSON
// Output: { componentTypes: string[], requiresLogic: boolean }
// ─────────────────────────────────────────────────────────────────────────────

const RouterOutputSchema = z.object({
  componentTypes: z
    .array(z.string())
    .describe("Component types needed from the registry"),
  requiresLogic: z
    .boolean()
    .describe("True if the form needs conditional skip-logic between pages"),
});

/**
 * Pass 1 — Router.
 * Uses a fast, cheap model to read the user's request and decide which
 * component types are required.  No form JSON is generated here.
 *
 * @param {string} userPrompt
 * @returns {Promise<{ componentTypes: string[], requiresLogic: boolean }>}
 */
async function runRouterPass(userPrompt) {
  const registeredTypes = getRegisteredComponentTypes();
  const catalogue = generateRouterCatalogue();

  const systemInstruction = `
You are a Form Component Analyst. Your ONLY job is to read the user's form request
and identify which component types from the registry are needed.

Available component types:
${catalogue}

Rules:
- Return ONLY the types from the list above. Do not invent new types.
- Include a type if it is clearly needed to fulfil the user's request.
- Set requiresLogic to true if the form needs conditional page navigation
  (e.g. "if answer is X, skip to page Y", branching questions, etc.).

Respond ONLY with a JSON object:
{ "componentTypes": ["TypeA", "TypeB"], "requiresLogic": false }
`.trim();

  const completion = await groq.chat.completions.create({
    model: ROUTER_MODEL,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 4096,
  });

  const raw = completion.choices[0].message.content;
  const parsed = JSON.parse(raw);
  const result = RouterOutputSchema.parse(parsed);

  // Guardrail: filter out any types not actually in the registry
  const validTypes = result.componentTypes.filter((t) =>
    registeredTypes.includes(t)
  );

  if (validTypes.length === 0) {
    // Fallback: use SingleLineInput so the Builder always has at least one schema
    console.warn("[Router] No valid component types returned. Falling back to SingleLineInput.");
    validTypes.push("SingleLineInput");
  }

  console.log(`[Router] Identified types: ${validTypes.join(", ")} | logic: ${result.requiresLogic}`);
  return { componentTypes: validTypes, requiresLogic: result.requiresLogic };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pass 2 — Builder  (heavy model + self-healing retry loop)
// Job   : generate the full validated ActionStream JSON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pass 2 — Builder.
 * Uses the heavy model with a laser-focused system prompt (only the schemas
 * the Router requested) and validates the output with Zod.  Retries up to
 * `maxRetries` times on schema violations, feeding errors back to the model.
 *
 * @param {string} userPrompt
 * @param {string[]} componentTypes   - from runRouterPass
 * @param {number}  maxRetries
 * @returns {Promise<import('../utils/aiForm.schema.js').ActionStream>}
 */
async function runBuilderPass(userPrompt, componentTypes, maxRetries = 2) {
  const systemInstruction = generateBuilderPrompt(componentTypes);

  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: userPrompt },
  ];

  let lastRawJsonString = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: BUILDER_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      });

      lastRawJsonString = completion.choices[0].message.content;
      const parsedJson = JSON.parse(lastRawJsonString);
      const validatedData = ActionStreamSchema.parse(parsedJson);
      console.log(`[Builder] Valid form generated on attempt ${attempt + 1}.`);
      return validatedData;
    } catch (error) {
      const isZodError =
        error.name === "ZodError" || (error.issues && Array.isArray(error.issues));

      if (isZodError) {
        console.warn(`[Builder] Attempt ${attempt + 1} — schema violation. Retrying...`);

        if (attempt === maxRetries) {
          throw new Error(
            `[Builder] Failed to produce a valid form after ${maxRetries + 1} attempt(s).`
          );
        }

        const errorDetails = error.issues?.length
          ? error.issues
              .map((e) => `Path '${e.path.join(".") || "(root)"}': ${e.message}`)
              .join("\n")
          : JSON.stringify(error.format ? error.format() : error.message);

        // Feed the error back into the conversation so the model can self-correct
        messages.push({ role: "assistant", content: lastRawJsonString });
        messages.push({
          role: "user",
          content:
            `Your previous response failed validation. Fix ONLY the errors listed below ` +
            `and return the complete, corrected JSON:\n\n${errorDetails}`,
        });
      } else {
        throw error; // Network/auth errors — surface immediately
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two-pass form generation pipeline.
 *
 * Pass 1 (Router):  fast model decides which component types are needed.
 * Pass 2 (Builder): heavy model generates the full ActionStream, validated
 *                   by Zod with a self-healing retry loop.
 *
 * @param {string} userPrompt
 * @param {{ maxRetries?: number }} [options]
 * @returns {Promise<import('../utils/aiForm.schema.js').ActionStream>}
 */
export async function generateFormDraftV2(userPrompt, { maxRetries = 2 } = {}) {
  // ── Pass 1: Router ──────────────────────────────────────────────────────
  const { componentTypes } = await runRouterPass(userPrompt);

  // ── Pass 2: Builder ─────────────────────────────────────────────────────
  return runBuilderPass(userPrompt, componentTypes, maxRetries);
}

/**
 * @deprecated Use generateFormDraftV2 instead.
 * Kept for backwards compatibility with existing route handlers.
 */
export async function generateFormDraft(prompt, maxRetries = 2) {
  return generateFormDraftV2(prompt, { maxRetries });
}
