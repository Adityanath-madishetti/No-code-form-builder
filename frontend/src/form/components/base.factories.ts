// src/form/components/base.factories.ts
/**
 * Form Factories
 * ------------------------------------------------------------------------------------------------
 * Utility factory functions for creating strongly-typed form entities.
 *
 * Purpose:
 * - Provide a consistent way to instantiate core form structures
 * - Avoid repetitive boilerplate when creating components/pages/forms
 * - Ensure default values and invariants are always respected
 *
 * Design Philosophy:
 * - Factories are **pure functions** (no side effects)
 * - Minimal logic → only initialization, no business rules
 * - Keep object creation centralized for easier refactoring
 *
 * ------------------------------------------------------------------------------------------------
 * When to use:
 * - Initializing new pages/forms
 * - Hydrating default state for stores (e.g., Zustand)
 *
 * ------------------------------------------------------------------------------------------------
 * Example Usage:
 *
 * const page = createFormPage('page_1');
 * page.children.push(input.instanceId);
 *
 * const form = createForm('form_1', 'User Signup');
 * form.pages.push(page.id);
 *
 * ------------------------------------------------------------------------------------------------
 * Notes:
 * - These factories do NOT enforce validation (leave that to higher layers)
 * - Safe to extend with additional defaults if the schema evolves
 *
 * ------------------------------------------------------------------------------------------------
 */

import type {
  FormID,
  FormMetadata,
  FormPage,
  PageID,
} from './base';

export function createFormPage(id: PageID): FormPage {
  return { id, children: [], isTerminal: true };
}

export function createForm(
  id: FormID,
  name: string,
  metadata?: Partial<FormMetadata>,
  themeID: string | null = null
) {
  const now = new Date().toISOString();
  return {
    id,
    name,
    themeID,
    pages: [] as PageID[],
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...metadata,
    },
  };
}
