# Logic System (Frontend + Backend): Quick Test

## 1) Setup
- Start backend and frontend:
  - `cd backend && npm run dev`
  - `cd frontend && npm run dev`
- Login as `owner@test.com`.

## 2) Create a test form
- Create a form with 3 pages.
- Add components:
  - Page 1: `Radio`, `Number`, `Dropdown`
  - Page 2: `Input`, `Email`
  - Page 3: `Checkbox`, `Matrix` (optional)
- Save once.

## 3) Logic authoring checks
- Open **Logic** panel.
- Verify:
  - Search works by rule name.
  - Filter works (`Field`, `Validation`, `Navigation`, `Formula`).
  - Sort works (name/updated).
  - Right-click menu works (open, rename, delete).
- Create rules:
  - Field rule: if radio value matches, show/hide a target field.
  - Validation rule: make a rule that blocks progression and shows a message.
  - Navigation rule: add `SKIP_PAGE` to jump to page 3.
  - Formula: set target field with expression like `ROUND({number} * 2, 0)`.
- Create 1 **Component Shuffle Stack**, assign 2+ components on same page, enable it.
- In component properties, enable **Option Shuffling** on radio/dropdown/checkbox.
- Save and Publish.

## 4) Important naming note (Radio)
- In the IF field picker, radio may appear by label like:
  - `Single Choice Question (Radio)`
- Use the component type shown in parentheses to identify it.

## 5) Runtime checks (published form link)
- Open form link in incognito/logged-out mode.
- Verify wizard flow:
  - One page at a time.
  - `Back` / `Next` works.
- Conditional visibility:
  - Trigger answer should immediately show/hide dependent fields.
- Conditional navigation:
  - `Next` should skip to configured page when condition matches.
- Validation blocking:
  - Invalid state should block `Next` and final `Submit`.
- Formula:
  - Computed target field updates when source fields change.
- Shuffling:
  - Option order is shuffled.
  - Stack component order is shuffled.
  - Order stays stable within same session.

## 6) Backend enforcement checks
- Try tampering values in hidden/disabled fields (devtools/manual payload):
  - Hidden/disabled values should not persist.
- Submit when validation rule is violated:
  - API should reject with logic/validation error (`422`/`409`).

## 7) Preview parity
- Open `/forms/:formId/preview`.
- Verify visibility/navigation/shuffle behavior matches runtime (read-only mode).

## 8) Regression
- Run:
  - `cd frontend && npm run typecheck && npm run build`
- Smoke flow:
  - Create form -> Save -> Publish -> Fill -> Review submission.
