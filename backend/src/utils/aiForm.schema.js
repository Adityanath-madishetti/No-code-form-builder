// backend/src/utils/aiForm.schema.js
import { z } from "zod";

export const TextValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  pattern: z.string().describe("Regex pattern without / delimiters").optional(),
});

export const SingleLineInputPropsSchema = z.object({
  questionText: z.string().describe("The actual question asked to the user"),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  hiddenByDefault: z.boolean().default(false),
});

// // The Component wrapper. The AI MUST use the exact 'id' string.
// export const FormComponentSchema = z.object({
//   id: z.literal("SingleLineInput"),
//   metadata: z.object({
//     label: z
//       .string()
//       .describe("Internal label for the builder UI (e.g., 'Email Input')"),
//   }),
//   props: SingleLineInputPropsSchema,
//   validation: TextValidationSchema,
// });

// export const FormPageSchema = z.object({
//   title: z.string().optional(),
//   description: z.string().optional(),
//   // Components are nested directly inside the page
//   components: z.array(FormComponentSchema),
// });

// export const GenerateFormDraftSchema = z.object({
//   formName: z.string(),
//   pages: z.array(FormPageSchema),
// });

// Export the TypeScript type for your frontend
// export type AIFormDraft = z.infer<typeof GenerateFormDraftSchema>;

// --- Base Operations ---
export const AddPageOp = z.object({
  action: z.literal("ADD_PAGE"),
  tempId: z.string().describe("A unique logical ID like 'page_1'"),
  title: z.string(),
  terminalPage: z
    .boolean()
    .default(false)
    .describe(
      "Set to true if this is the page of the form where the user is allowed to Submit. " +
      "More than one page can be terminal in multi-page forms. " +
      "Single-page forms should always have terminalPage: true."
    ),
  nextPageId: z
    .string()
    .nullable()
    .optional()
    .describe(
      "The tempId of the page to navigate to after this one. " +
      "Omit or set to null to use the default sequential next page. " +
      "Only set this when you need to jump to a non-sequential page unconditionally " +
      "(e.g. always skip page_2 and go to page_3 regardless of answers). " +
      "Do NOT set this on terminal pages."
    ),
});

// --- Component Tool Signatures ---

// 1. Single Line Input
export const AddSingleLineOp = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("SingleLineInput"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    type: z.enum(["text", "email", "number", "tel", "url"]).default("text"),
    questionText: z.string(),
    placeholder: z.string().optional(),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({ required: z.boolean() }),
});

// 2. Radio Input
export const AddRadioOp = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("Radio"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    layout: z.enum(["vertical", "horizontal"]).default("vertical"),
    shuffleOptions: z.boolean().default(false),
    hiddenByDefault: z.boolean().default(false),
    // AI must generate the options array with its own logical IDs
    options: z.array(
      z.object({
        id: z.string().describe("A unique logical ID like 'opt_1'"),
        value: z.string(),
      }),
    ),
  }),
  validation: z.object({ required: z.boolean() }),
});

export const AddComponentOp = z.object({
  action: z.literal("ADD_COMPONENT"),
  tempId: z.string().describe("Logical ID like 'field_name'"),
  targetPageId: z.string().describe("The tempId of the page this belongs to"),
  type: z.enum(["text", "email", "number"]),
  label: z.string(),
  required: z.boolean(),
});

// --- Logic Operations ---
export const AddSkipLogicOp = z.object({
  action: z.literal("ADD_SKIP_LOGIC"),
  sourceFieldId: z.string(),
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
  ]),
  value: z.any().optional(),
  targetPageId: z.string(),
});

// --- The Master Payload ---
// We combine all possible actions into one massive stream.
// As you add Dropdowns, Checkboxes, etc., you just add them to this array!
export const ActionStreamSchema = z.object({
  formName: z.string(),
  operations: z.array(
    z.discriminatedUnion("action", [
      AddPageOp,
      AddSkipLogicOp,
      // We group the components under the same ADD_COMPONENT action, 
      // but discriminate them further by componentType!
    ]).or(z.discriminatedUnion("componentType", [
      AddSingleLineOp,
      AddRadioOp
    ]))
  ),
});
/**
 * @typedef {import('zod').infer<typeof ActionStreamSchema>} ActionStream
 */

/**
 * Neatly prints the form generation action stream to the console.
 * @param {ActionStream} actionStream - The parsed action stream object.
 */
export function printActionStream(actionStream) {
  console.log(`\n=== 📝 Form Action Stream: ${actionStream.formName} ===\n`);

  if (!actionStream.operations || actionStream.operations.length === 0) {
    console.log("No operations found in the stream.");
    return;
  }

  actionStream.operations.forEach((op, index) => {
    const step = (index + 1).toString().padStart(2, "0");

    switch (op.action) {
      case "ADD_PAGE":
        console.log(`[${step}] 📄 ADD PAGE`);
        console.log(`      ID:    ${op.tempId}`);
        console.log(`      Title: "${op.title}"\n`);
        break;

      case "ADD_COMPONENT":
        console.log(`[${step}] 🧩 ADD COMPONENT`);
        console.log(`      ID:       ${op.tempId}`);
        console.log(`      Page:     ${op.targetPageId}`);
        console.log(`      Type:     ${op.type}`);
        console.log(`      Label:    "${op.label}"`);
        console.log(`      Required: ${op.required ? "Yes" : "No"}\n`);
        break;

      case "ADD_SKIP_LOGIC":
        console.log(`[${step}] 🔀 ADD SKIP LOGIC`);
        console.log(
          `      Trigger:  If '${op.sourceFieldId}' ${op.operator} ${op.value !== undefined ? `'${op.value}'` : "(no value)"}`,
        );
        console.log(`      Action:   Skip to page '${op.targetPageId}'\n`);
        break;

      default:
        console.log(`[${step}] ⚠️ UNKNOWN ACTION:`, op);
        break;
    }
  });

  console.log(`=== End of Stream ===\n`);
}
