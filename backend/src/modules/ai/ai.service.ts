// backend/src/modules/ai/ai.service.ts

import { Groq } from 'groq-sdk';
import { ActionStreamSchema, ActionStream } from './ai.schema.js';
import { z } from 'zod';
import { generateBuilderPrompt, generateRouterCatalogue } from './ai.prompt-builder.js';
import { getRegisteredComponentTypes } from './ai.registry.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ROUTER_MODEL = 'llama-3.1-8b-instant';
const BUILDER_MODEL = 'llama-3.3-70b-versatile';

const RouterOutputSchema = z.object({
  componentTypes: z.array(z.string()).describe('Component types needed from the registry'),
  requiresLogic: z.boolean().describe('True if the form needs conditional skip-logic between pages'),
});

async function runRouterPass(userPrompt: string) {
  const registeredTypes = getRegisteredComponentTypes();
  const catalogue = generateRouterCatalogue();

  const systemInstruction = `
You are a Form Component Analyst. Your ONLY job is to identify which UNIQUE component types are needed.

Available component types (${registeredTypes.length} total):
${catalogue}

Rules:
- Return a DEDUPLICATED SET — each type appears at most once, regardless of how many fields use it.
- Only include types that are clearly needed by the user's request.
- Set requiresLogic to true if the form needs conditional navigation or show/hide logic.
- The componentTypes array must have AT MOST ${registeredTypes.length} items.

Respond with ONLY this JSON (no markdown, no explanation):
{ "componentTypes": ["TypeA", "TypeB"], "requiresLogic": false }
`.trim();

  const completion = await groq.chat.completions.create({
    model: ROUTER_MODEL,
    temperature: 0,
    max_tokens: 512,
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ],
  });

  const raw = completion.choices[0].message.content || '';
  const stripped = raw
    .replace(/^```[\w]*\n?/m, '')
    .replace(/```\s*$/m, '')
    .trim();

  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`[Router] No JSON object found in model response: ${raw}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const result = RouterOutputSchema.parse(parsed);

  const uniqueTypes = [...new Set(result.componentTypes)];
  const validTypes = uniqueTypes.filter((t) => registeredTypes.includes(t));

  if (validTypes.length === 0) {
    console.warn('[Router] No valid component types returned. Falling back to SingleLineInput.');
    validTypes.push('SingleLineInput');
  }

  console.log(
    `[Router] Identified types: ${validTypes.join(', ')} | logic: ${result.requiresLogic}`,
  );
  return { componentTypes: validTypes, requiresLogic: result.requiresLogic };
}

async function runBuilderPass(
  userPrompt: string,
  componentTypes: string[],
  maxRetries = 2,
): Promise<ActionStream> {
  const systemInstruction = generateBuilderPrompt(componentTypes);

  const messages: any[] = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: userPrompt },
  ];

  let lastRawJsonString = '';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await groq.chat.completions.create({
        model: BUILDER_MODEL,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 8192,
        messages,
      });

      lastRawJsonString = completion.choices[0].message.content || '';
      const parsedJson = JSON.parse(lastRawJsonString);
      const validatedData = ActionStreamSchema.parse(parsedJson);
      console.log(`[Builder] Valid form generated on attempt ${attempt + 1}.`);
      return validatedData as ActionStream;
    } catch (error: any) {
      const isZodError = error.name === 'ZodError' || (error.issues && Array.isArray(error.issues));

      if (isZodError) {
        console.warn(`[Builder] Attempt ${attempt + 1} — schema violation. Retrying...`);

        if (attempt === maxRetries) {
          throw new Error(
            `[Builder] Failed to produce a valid form after ${maxRetries + 1} attempt(s).`,
          );
        }

        const errorDetails = error.issues?.length
          ? error.issues.map((e: any) => `Path '${e.path.join('.') || '(root)'}': ${e.message}`).join('\n')
          : JSON.stringify(error.format ? error.format() : error.message);

        messages.push({ role: 'assistant', content: lastRawJsonString });
        messages.push({
          role: 'user',
          content:
            `Your previous response failed validation. Fix ONLY the errors listed below ` +
            `and return the complete, corrected JSON:\n\n${errorDetails}`,
        });
      } else {
        throw error;
      }
    }
  }
  throw new Error('[Builder] Unexpected loop exit');
}

export const generateFormDraftService = async (
  userPrompt: string,
  options: { maxRetries?: number } = {},
): Promise<ActionStream> => {
  const { componentTypes } = await runRouterPass(userPrompt);
  return runBuilderPass(userPrompt, componentTypes, options.maxRetries || 2);
};
