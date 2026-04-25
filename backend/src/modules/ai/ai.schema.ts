// backend/src/modules/ai/ai.schema.ts

import { z } from 'zod';

export const TextValidationSchema = z.object({
  required: z.boolean().default(false),
  minLength: z.number().min(0).optional(),
  maxLength: z.number().min(1).optional(),
  pattern: z.string().describe('Regex pattern without / delimiters').optional(),
});

export const SingleLineInputPropsSchema = z.object({
  questionText: z.string().describe('The actual question asked to the user'),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
  hiddenByDefault: z.boolean().default(false),
});

// --- Base Operations ---
export const AddPageOp = z.object({
  action: z.literal('ADD_PAGE'),
  tempId: z.string().describe("A unique logical ID like 'page_1'"),
  title: z.string(),
  terminalPage: z
    .boolean()
    .default(false)
    .describe(
      'Set to true if this is the page of the form where the user is allowed to Submit. ' +
        'More than one page can be terminal in multi-page forms. ' +
        'Single-page forms should always have terminalPage: true.',
    ),
  nextPageId: z
    .string()
    .nullable()
    .optional()
    .describe(
      'The tempId of the page to navigate to after this one. ' +
        'Omit or set to null to use the default sequential next page. ' +
        'Only set this when you need to jump to a non-sequential page unconditionally ' +
        '(e.g. always skip page_2 and go to page_3 regardless of answers). ' +
        'Do NOT set this on terminal pages.',
    ),
});

// --- Component Tool Signatures ---

// 1. Single Line Input
export const AddSingleLineOp = z.object({
  action: z.literal('ADD_COMPONENT'),
  componentType: z.literal('SingleLineInput'),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    type: z.enum(['text', 'email', 'number', 'tel', 'url']).default('text'),
    questionText: z.string(),
    placeholder: z.string().optional(),
    hiddenByDefault: z.boolean().default(false),
  }),
  validation: z.object({ required: z.boolean() }),
});

// 2. Radio Input
export const AddRadioOp = z.object({
  action: z.literal('ADD_COMPONENT'),
  componentType: z.literal('Radio'),
  tempId: z.string(),
  targetPageId: z.string(),
  label: z.string(),
  props: z.object({
    questionText: z.string(),
    layout: z.enum(['vertical', 'horizontal']).default('vertical'),
    shuffleOptions: z.boolean().default(false),
    hiddenByDefault: z.boolean().default(false),
    options: z.array(
      z.object({
        id: z.string().describe("A unique logical ID like 'opt_1'"),
        value: z.string(),
      }),
    ),
  }),
  validation: z.object({ required: z.boolean() }),
});

// --- Logic Operations ---
export const AddSkipLogicOp = z.object({
  action: z.literal('ADD_SKIP_LOGIC'),
  sourceFieldId: z.string(),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
  ]),
  value: z.any().optional(),
  targetPageId: z.string(),
});

export const AddVisibilityLogicOp = z.object({
  action: z.literal('ADD_VISIBILITY_LOGIC'),
  sourceFieldId: z.string().describe('tempId of the field whose value is evaluated'),
  operator: z.enum([
    'equals',
    'not_equals',
    'contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
  ]),
  value: z.any().optional().describe('The comparison value. Omit for is_empty / is_not_empty.'),
  targetFieldId: z.string().describe('tempId of the component to show or hide'),
  thenAction: z
    .enum(['SHOW', 'HIDE'])
    .describe(
      'SHOW: make targetField visible when condition is true. ' +
        'HIDE: conceal targetField when condition is true.',
    ),
});

// --- The Master Payload ---
export const ActionStreamSchema = z.object({
  formName: z.string(),
  operations: z.array(
    z
      .discriminatedUnion('action', [AddPageOp, AddSkipLogicOp, AddVisibilityLogicOp])
      .or(z.discriminatedUnion('componentType', [AddSingleLineOp, AddRadioOp])),
  ),
});

export type ActionStream = z.infer<typeof ActionStreamSchema>;

export function printActionStream(actionStream: ActionStream) {
  console.log(`\n=== 📝 Form Action Stream: ${actionStream.formName} ===\n`);

  if (!actionStream.operations || actionStream.operations.length === 0) {
    console.log('No operations found in the stream.');
    return;
  }

  actionStream.operations.forEach((op: any, index) => {
    const step = (index + 1).toString().padStart(2, '0');

    switch (op.action) {
      case 'ADD_PAGE':
        console.log(`[${step}] 📄 ADD PAGE`);
        console.log(`      ID:    ${op.tempId}`);
        console.log(`      Title: "${op.title}"\n`);
        break;

      case 'ADD_COMPONENT':
        console.log(`[${step}] 🧩 ADD COMPONENT`);
        console.log(`      ID:       ${op.tempId}`);
        console.log(`      Page:     ${op.targetPageId}`);
        console.log(`      Type:     ${op.componentType}`);
        console.log(`      Label:    "${op.label}"`);
        console.log(`      Required: ${op.validation?.required ? 'Yes' : 'No'}\n`);
        break;

      case 'ADD_SKIP_LOGIC':
        console.log(`[${step}] 🔀 ADD SKIP LOGIC`);
        console.log(
          `      Trigger:  If '${op.sourceFieldId}' ${op.operator} ${op.value !== undefined ? `'${op.value}'` : '(no value)'}`,
        );
        console.log(`      Action:   Skip to page '${op.targetPageId}'\n`);
        break;

      case 'ADD_VISIBILITY_LOGIC':
        console.log(`[${step}] 👁 ADD VISIBILITY LOGIC`);
        console.log(
          `      Trigger:  If '${op.sourceFieldId}' ${op.operator} ${op.value !== undefined ? `'${op.value}'` : '(no value)'}`,
        );
        console.log(`      Action:   ${op.thenAction} '${op.targetFieldId}'\n`);
        break;

      default:
        console.log(`[${step}] ⚠️ UNKNOWN ACTION:`, op);
        break;
    }
  });

  console.log(`=== End of Stream ===\n`);
}
