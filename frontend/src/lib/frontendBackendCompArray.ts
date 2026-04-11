import { ComponentIDs } from '@/form/components/base';

export const frontendToBackend: Record<string, string> = {
  [ComponentIDs.TextBox]: 'text-box',
  [ComponentIDs.Header]: 'heading',
  [ComponentIDs.LineDivider]: 'line-divider',
  [ComponentIDs.SingleLineInput]: 'single-line-input',
  [ComponentIDs.MultiLineInput]: 'multi-line-input',
  [ComponentIDs.Number]: 'number',
  [ComponentIDs.Decimal]: 'decimal',
  [ComponentIDs.Radio]: 'radio',
  [ComponentIDs.Checkbox]: 'checkbox',
  [ComponentIDs.Dropdown]: 'dropdown',
};

export const backendToFrontend: Record<string, string> = {};
for (const [fe, be] of Object.entries(frontendToBackend)) {
  if (!backendToFrontend[be]) backendToFrontend[be] = fe;
}
