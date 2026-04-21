// backend/src/registry/components.js
//
// Central Component Registry.
// Each entry maps a componentType string to:
//   - schema   : The Zod schema for the ADD_COMPONENT operation (used to build the prompt)
//   - description : Short human-readable hint for the Router pass (Pass 1)
//   - example  : A concrete JSON string the Builder pass (Pass 2) can imitate
//
// Adding a new component = add one key here + register the schema in
// aiForm.schema.js's ActionStreamSchema union.

import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Shared primitive sub-schemas (keep in sync with aiForm.schema.js)
// ─────────────────────────────────────────────────────────────────────────────

const OptionSchema = z.object({
  id: z.string().describe("A unique logical ID like 'opt_1'"),
  value: z.string(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Per-component ADD_COMPONENT Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

const SingleLineInputSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("SingleLineInput"),
  tempId: z.string().describe("Logical ID like 'field_email'"),
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

const MultiLineInputSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("MultiLineInput"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    placeholder: z.string().optional(),
    rows: z.number().int().min(1).max(20).default(4),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({
    required: z.boolean(),
    minLength: z.number().min(0).optional(),
    maxLength: z.number().min(1).optional(),
  }),
});

const RadioSchema = z.object({
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
    options: z.array(OptionSchema),
  }),
  validation: z.object({ required: z.boolean() }),
});

const CheckboxSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("Checkbox"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    layout: z.enum(["vertical", "horizontal"]).default("vertical"),
    shuffleOptions: z.boolean().default(false),
    hiddenByDefault: z.boolean().default(false),
    options: z.array(OptionSchema),
  }),
  validation: z.object({
    required: z.boolean(),
    minSelected: z.number().int().min(0).optional(),
    maxSelected: z.number().int().min(1).optional(),
  }),
});

const DropdownSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("Dropdown"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    placeholder: z.string().optional(),
    shuffleOptions: z.boolean().default(false),
    hiddenByDefault: z.boolean().default(false),
    options: z.array(OptionSchema),
  }),
  validation: z.object({ required: z.boolean() }),
});

const RatingScaleSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("RatingScale"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    maxRating: z.number().int().min(1).max(20).default(5),
    icon: z.enum(["star", "heart", "circle"]).default("star"),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({
    required: z.boolean(),
    minRating: z.number().int().optional(),
    maxRating: z.number().int().optional(),
  }),
});

const LinearScaleSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("LinearScale"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    min: z.number().int().default(1),
    max: z.number().int().default(10),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({ required: z.boolean() }),
});

const DateSchema = z.object({
  action: z.literal("ADD_COMPONENT"),
  componentType: z.literal("Date"),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    includeTime: z.boolean().default(false),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({
    required: z.boolean(),
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
  }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry Export
// ─────────────────────────────────────────────────────────────────────────────

export const ComponentRegistry = {
  // ── Text Inputs ──────────────────────────────────────────────────────────
  SingleLineInput: {
    description:
      "A single-line text field. Use for names, emails, phone numbers, URLs, or any short free-text answer.",
    schema: SingleLineInputSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "SingleLineInput",
      tempId: "field_email",
      targetPageId: "page_1",
      label: "Email Address",
      props: { type: "email", questionText: "What is your email?" },
      validation: { required: true },
    }),
  },

  MultiLineInput: {
    description:
      "A multi-line textarea. Use for long-form answers, comments, or descriptions.",
    schema: MultiLineInputSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "MultiLineInput",
      tempId: "field_bio",
      targetPageId: "page_1",
      label: "Bio",
      props: { questionText: "Tell us about yourself.", rows: 4 },
      validation: { required: false },
    }),
  },

  // ── Selection ─────────────────────────────────────────────────────────────
  Radio: {
    description:
      "A single-choice radio group. Use when the respondent must pick exactly one option from a visible list.",
    schema: RadioSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "Radio",
      tempId: "field_role",
      targetPageId: "page_1",
      label: "Role",
      props: {
        questionText: "What is your role?",
        layout: "vertical",
        options: [
          { id: "opt_1", value: "Frontend" },
          { id: "opt_2", value: "Backend" },
          { id: "opt_3", value: "Designer" },
        ],
      },
      validation: { required: true },
    }),
  },

  Checkbox: {
    description:
      "A multi-choice checkbox group. Use when the respondent may pick one or more options.",
    schema: CheckboxSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "Checkbox",
      tempId: "field_skills",
      targetPageId: "page_1",
      label: "Skills",
      props: {
        questionText: "Select all skills that apply.",
        layout: "vertical",
        options: [
          { id: "opt_1", value: "React" },
          { id: "opt_2", value: "Node.js" },
          { id: "opt_3", value: "TypeScript" },
        ],
      },
      validation: { required: true, minSelected: 1 },
    }),
  },

  Dropdown: {
    description:
      "A dropdown / select field. Use when there are many options and screen space is limited.",
    schema: DropdownSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "Dropdown",
      tempId: "field_country",
      targetPageId: "page_1",
      label: "Country",
      props: {
        questionText: "Which country are you from?",
        placeholder: "Select a country…",
        options: [
          { id: "opt_1", value: "India" },
          { id: "opt_2", value: "USA" },
          { id: "opt_3", value: "UK" },
        ],
      },
      validation: { required: true },
    }),
  },

  // ── Scales ────────────────────────────────────────────────────────────────
  RatingScale: {
    description:
      "A star/heart/circle icon rating. Use for product ratings, satisfaction scores, or any 'out of N' rating.",
    schema: RatingScaleSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "RatingScale",
      tempId: "field_satisfaction",
      targetPageId: "page_1",
      label: "Satisfaction",
      props: { questionText: "How satisfied are you?", maxRating: 5, icon: "star" },
      validation: { required: true },
    }),
  },

  LinearScale: {
    description:
      "A numeric range selector (e.g. 1–10). Use for NPS scores, agreement scales, or any ranged opinion question.",
    schema: LinearScaleSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "LinearScale",
      tempId: "field_nps",
      targetPageId: "page_1",
      label: "NPS",
      props: {
        questionText: "How likely are you to recommend us? (0 = Not at all, 10 = Extremely)",
        min: 0,
        max: 10,
        minLabel: "Not likely",
        maxLabel: "Very likely",
      },
      validation: { required: true },
    }),
  },

  // ── Date & Time ───────────────────────────────────────────────────────────
  Date: {
    description:
      "A date (or date-time) picker. Use for birthdays, appointment dates, deadlines, or any calendar-based answer.",
    schema: DateSchema,
    example: JSON.stringify({
      action: "ADD_COMPONENT",
      componentType: "Date",
      tempId: "field_dob",
      targetPageId: "page_1",
      label: "Date of Birth",
      props: { questionText: "What is your date of birth?", includeTime: false },
      validation: { required: true },
    }),
  },
};

/**
 * Returns an array of all registered component type keys.
 * @returns {string[]}
 */
export function getRegisteredComponentTypes() {
  return Object.keys(ComponentRegistry);
}
