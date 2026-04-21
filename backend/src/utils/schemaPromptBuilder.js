// backend/src/utils/schemaPromptBuilder.js
//
// generateBuilderPrompt(activeComponents)
// ─────────────────────────────────────────
// Builds the "laser-focused" system instruction for the Builder (Pass 2).
// It always includes the base ADD_PAGE and ADD_SKIP_LOGIC rules, then
// selectively injects only the ADD_COMPONENT rules for the component types
// that the Router (Pass 1) deemed necessary.
//
// This means the heavy model never sees schemas for components it won't use,
// keeping token count low and error rates lower.

import { ComponentRegistry } from "../registry/components.js";
import { zodToJsonSchema } from "zod-to-json-schema";

// ─────────────────────────────────────────────────────────────────────────────
// Base (always-included) rules
// ─────────────────────────────────────────────────────────────────────────────

const BASE_RULES = `
You are an expert Form Architect. Respond ONLY with valid JSON representing a
chronological action stream.

CRITICAL RULES:
1. Output operations in EXACT chronological order:
   ADD_PAGE → ADD_COMPONENT → ADD_SKIP_LOGIC → ADD_VISIBILITY_LOGIC.
2. Invent logical IDs (e.g. 'page_1', 'field_email', 'opt_1') for ALL tempId and id fields.
3. DO NOT invent properties. Strictly follow the operation shapes listed below.
4. For ADD_SKIP_LOGIC: conditions MUST be FLAT — do NOT nest conditions.
5. For ADD_PAGE: set terminalPage to true on every page that ends a navigation path (i.e. the
   user would click Submit from that page). In a linear form this is the last page only. In a
   branching form, multiple pages can be terminal — any page that is a dead-end in the graph
   (no outgoing skip-logic, or it is the final page of a branch). Single-page forms: always true.
6. hiddenByDefault (on ADD_COMPONENT props): set to true when a component should start hidden
   and only become visible via an ADD_VISIBILITY_LOGIC rule. Leave false (default) otherwise.

─────────────────────────────────────────
REQUIRED OPERATION SHAPES
─────────────────────────────────────────

▸ ADD_PAGE
  {
    "action": "ADD_PAGE",
    "tempId": "page_1",
    "title": "Page Title",
    "terminalPage": false,
    "nextPageId": null
  }
  ↳ terminalPage (boolean, required):
      • false  — intermediate page; user navigates to the next page.
      • true   — page where the user sees the Submit button.
      More than one page can be terminal depending on the branching structure.
      Single-page forms: always true.
  ↳ nextPageId (string | null, optional):
      • null / omit — the form proceeds to the sequentially next page (default).
      • "page_X"   — unconditionally jump to that page after this one, regardless
                     of answer.  Use this ONLY when a page should always skip ahead
                     (e.g. an intro page that always leads to page_3, bypassing page_2).
      Do NOT set nextPageId on terminal pages.

▸ ADD_SKIP_LOGIC
  {
    "action": "ADD_SKIP_LOGIC",
    "sourceFieldId": "<tempId of the triggering field>",
    "operator": "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty",
    "value": "<comparison value — omit for is_empty / is_not_empty>",
    "targetPageId": "<tempId of the destination page>"
  }

▸ ADD_VISIBILITY_LOGIC  (conditional show / hide a component)
  {
    "action": "ADD_VISIBILITY_LOGIC",
    "sourceFieldId": "<tempId of the field whose value is evaluated>",
    "operator": "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty",
    "value": "<comparison value — omit for is_empty / is_not_empty>",
    "targetFieldId": "<tempId of the component to show or hide>",
    "thenAction": "SHOW" | "HIDE"
  }
  ↳ thenAction:
      • "SHOW" — targetField is hidden by default; reveal it when condition is true.
                 Remember to set hiddenByDefault: true on the target component's props.
      • "HIDE" — targetField is visible by default; hide it when condition is true.
  ↳ Use ADD_VISIBILITY_LOGIC (not ADD_SKIP_LOGIC) when you want to show/hide a field
    on the SAME page based on another field's answer.
`.trim();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a Zod schema to a compact JSON Schema string.
 * Strips the `$schema` meta-key so the output stays concise.
 *
 * @param {import('zod').ZodTypeAny} zodSchema
 * @returns {string}
 */
function zodToPromptString(zodSchema) {
  const jsonSchema = zodToJsonSchema(zodSchema, {
    $refStrategy: "none", // inline everything, no $ref
    errorMessages: false,
  });
  // Remove the top-level $schema key to keep output clean
  delete jsonSchema["$schema"];
  return JSON.stringify(jsonSchema, null, 2);
}

/**
 * Builds one ADD_COMPONENT block for display in the prompt.
 *
 * @param {string} componentType
 * @param {{ schema: import('zod').ZodTypeAny, description: string, example: string }} entry
 * @returns {string}
 */
function buildComponentBlock(componentType, entry) {
  const schemaString = zodToPromptString(entry.schema);

  return `
▸ ADD_COMPONENT — ${componentType}
  When to use: ${entry.description}

  JSON Schema:
${schemaString
  .split("\n")
  .map((l) => `  ${l}`)
  .join("\n")}

  Concrete example:
  ${entry.example}
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a dynamic system-instruction prompt for the Builder model.
 *
 * Only the component types listed in `activeComponents` are included, so the
 * model never sees (and thus cannot hallucinate) schemas it doesn't need.
 *
 * @param {string[]} activeComponents  — e.g. ["SingleLineInput", "Radio"]
 * @returns {string}  Full system prompt ready to pass as the system message.
 *
 * @throws {Error} if a requested component type is not in the registry.
 */
export function generateBuilderPrompt(activeComponents) {
  if (!Array.isArray(activeComponents) || activeComponents.length === 0) {
    throw new Error(
      "generateBuilderPrompt: activeComponents must be a non-empty array of component type strings.",
    );
  }

  const unknownTypes = activeComponents.filter((t) => !ComponentRegistry[t]);
  if (unknownTypes.length > 0) {
    throw new Error(
      `generateBuilderPrompt: Unknown component type(s): ${unknownTypes.join(", ")}. ` +
        `Registered types: ${Object.keys(ComponentRegistry).join(", ")}`,
    );
  }

  const componentBlocks = activeComponents
    .map((type) => buildComponentBlock(type, ComponentRegistry[type]))
    .join("\n\n");

  const prompt = `
${BASE_RULES}

─────────────────────────────────────────
ACTIVE COMPONENT SCHEMAS (use ONLY these)
─────────────────────────────────────────

${componentBlocks}

─────────────────────────────────────────
OUTPUT FORMAT
─────────────────────────────────────────
Respond with a single JSON object:
{
  "formName": "<descriptive form name>",
  "operations": [ ...ordered list of ADD_PAGE, ADD_COMPONENT, and ADD_SKIP_LOGIC objects ]
}
`.trim();

  return prompt;
}

/**
 * Convenience: returns a plain-text catalogue of all registered component types
 * and their descriptions. Used by the Router (Pass 1) model so it can decide
 * which components are needed WITHOUT seeing the full schemas.
 *
 * @returns {string}
 */
export function generateRouterCatalogue() {
  const lines = Object.entries(ComponentRegistry).map(
    ([type, entry]) => `- ${type}: ${entry.description}`,
  );
  return lines.join("\n");
}
