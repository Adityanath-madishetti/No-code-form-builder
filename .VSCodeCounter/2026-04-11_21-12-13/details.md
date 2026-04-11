# Details

Date : 2026-04-11 21:12:13

Directory /Users/sathvik/wayne/fox/No-Code-Form-Builder-And-Workflow

Total : 217 files,  45743 codes, 2925 comments, 3243 blanks, all 51911 lines

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)

## Files
| filename | language | code | comment | blank | total |
| :--- | :--- | ---: | ---: | ---: | ---: |
| [.github/workflows/ci-backend.yml](/.github/workflows/ci-backend.yml) | YAML | 35 | 0 | 9 | 44 |
| [.github/workflows/ci-frontend.yml](/.github/workflows/ci-frontend.yml) | YAML | 41 | 0 | 11 | 52 |
| [README.md](/README.md) | Markdown | 46 | 0 | 17 | 63 |
| [backend/README.md](/backend/README.md) | Markdown | 74 | 0 | 19 | 93 |
| [backend/package-lock.json](/backend/package-lock.json) | JSON | 4,646 | 0 | 1 | 4,647 |
| [backend/package.json](/backend/package.json) | JSON | 35 | 0 | 1 | 36 |
| [backend/src/app.js](/backend/src/app.js) | JavaScript | 25 | 36 | 10 | 71 |
| [backend/src/config/firebase.js](/backend/src/config/firebase.js) | JavaScript | 40 | 14 | 7 | 61 |
| [backend/src/config/swagger.js](/backend/src/config/swagger.js) | JavaScript | 28 | 1 | 3 | 32 |
| [backend/src/controllers/authController.js](/backend/src/controllers/authController.js) | JavaScript | 12 | 0 | 2 | 14 |
| [backend/src/controllers/formController.js](/backend/src/controllers/formController.js) | JavaScript | 78 | 0 | 9 | 87 |
| [backend/src/controllers/formVersionController.js](/backend/src/controllers/formVersionController.js) | JavaScript | 81 | 0 | 9 | 90 |
| [backend/src/controllers/submissionController.js](/backend/src/controllers/submissionController.js) | JavaScript | 72 | 0 | 8 | 80 |
| [backend/src/controllers/userController.js](/backend/src/controllers/userController.js) | JavaScript | 29 | 0 | 4 | 33 |
| [backend/src/controllers/workflowController.js](/backend/src/controllers/workflowController.js) | JavaScript | 59 | 0 | 8 | 67 |
| [backend/src/db/db.js](/backend/src/db/db.js) | JavaScript | 17 | 0 | 5 | 22 |
| [backend/src/middleware/auth.js](/backend/src/middleware/auth.js) | JavaScript | 29 | 12 | 9 | 50 |
| [backend/src/middleware/errorHandler.js](/backend/src/middleware/errorHandler.js) | JavaScript | 18 | 14 | 4 | 36 |
| [backend/src/models/Form.js](/backend/src/models/Form.js) | JavaScript | 91 | 3 | 15 | 109 |
| [backend/src/models/FormVersion.js](/backend/src/models/FormVersion.js) | JavaScript | 444 | 31 | 105 | 580 |
| [backend/src/models/Submission.js](/backend/src/models/Submission.js) | JavaScript | 84 | 5 | 21 | 110 |
| [backend/src/models/User.js](/backend/src/models/User.js) | JavaScript | 41 | 0 | 10 | 51 |
| [backend/src/routes/authRoutes.js](/backend/src/routes/authRoutes.js) | JavaScript | 5 | 35 | 4 | 44 |
| [backend/src/routes/formRoutes.js](/backend/src/routes/formRoutes.js) | JavaScript | 34 | 249 | 10 | 293 |
| [backend/src/routes/formVersionRoutes.js](/backend/src/routes/formVersionRoutes.js) | JavaScript | 23 | 196 | 6 | 225 |
| [backend/src/routes/submissionRoutes.js](/backend/src/routes/submissionRoutes.js) | JavaScript | 18 | 130 | 5 | 153 |
| [backend/src/routes/userRoutes.js](/backend/src/routes/userRoutes.js) | JavaScript | 8 | 61 | 4 | 73 |
| [backend/src/routes/workflowRoutes.js](/backend/src/routes/workflowRoutes.js) | JavaScript | 10 | 53 | 4 | 67 |
| [backend/src/server.js](/backend/src/server.js) | JavaScript | 17 | 0 | 6 | 23 |
| [backend/src/services/authService.js](/backend/src/services/authService.js) | JavaScript | 44 | 0 | 8 | 52 |
| [backend/src/services/formService.js](/backend/src/services/formService.js) | JavaScript | 234 | 0 | 40 | 274 |
| [backend/src/services/formVersionService.js](/backend/src/services/formVersionService.js) | JavaScript | 195 | 0 | 45 | 240 |
| [backend/src/services/logicEngine.js](/backend/src/services/logicEngine.js) | JavaScript | 219 | 6 | 27 | 252 |
| [backend/src/services/logicEngine/conditionTree.js](/backend/src/services/logicEngine/conditionTree.js) | JavaScript | 45 | 0 | 7 | 52 |
| [backend/src/services/logicEngine/formulaParser.js](/backend/src/services/logicEngine/formulaParser.js) | JavaScript | 228 | 0 | 24 | 252 |
| [backend/src/services/logicEngine/helpers.js](/backend/src/services/logicEngine/helpers.js) | JavaScript | 25 | 0 | 3 | 28 |
| [backend/src/services/logicEngine/normalizer.js](/backend/src/services/logicEngine/normalizer.js) | JavaScript | 146 | 0 | 26 | 172 |
| [backend/src/services/submissionService.js](/backend/src/services/submissionService.js) | JavaScript | 353 | 0 | 67 | 420 |
| [backend/src/services/userService.js](/backend/src/services/userService.js) | JavaScript | 50 | 0 | 12 | 62 |
| [backend/src/services/workflowEngine.js](/backend/src/services/workflowEngine.js) | JavaScript | 117 | 65 | 26 | 208 |
| [backend/src/services/workflowService.js](/backend/src/services/workflowService.js) | JavaScript | 147 | 0 | 33 | 180 |
| [backend/src/utils/conditionEvaluator.js](/backend/src/utils/conditionEvaluator.js) | JavaScript | 49 | 34 | 17 | 100 |
| [backend/src/utils/formPermissions.js](/backend/src/utils/formPermissions.js) | JavaScript | 226 | 0 | 45 | 271 |
| [backend/src/utils/validators.js](/backend/src/utils/validators.js) | JavaScript | 261 | 17 | 9 | 287 |
| [docs/Logic Panel & Page.md](/docs/Logic%20Panel%20&%20Page.md) | Markdown | 21 | 0 | 7 | 28 |
| [docs/form-properties-test-quickcheck.md](/docs/form-properties-test-quickcheck.md) | Markdown | 31 | 0 | 6 | 37 |
| [docs/logic-system-test-quickcheck.md](/docs/logic-system-test-quickcheck.md) | Markdown | 62 | 0 | 9 | 71 |
| [frontend/.prettierignore](/frontend/.prettierignore) | Ignore | 7 | 0 | 1 | 8 |
| [frontend/.prettierrc](/frontend/.prettierrc) | JSON | 11 | 0 | 1 | 12 |
| [frontend/COMPONENT\_ADD\_GUIDE.md](/frontend/COMPONENT_ADD_GUIDE.md) | Markdown | 139 | 0 | 49 | 188 |
| [frontend/README.md](/frontend/README.md) | Markdown | 73 | 0 | 13 | 86 |
| [frontend/SCHEMA.json](/frontend/SCHEMA.json) | JSON | 22 | 0 | 1 | 23 |
| [frontend/components.json](/frontend/components.json) | JSON | 25 | 0 | 1 | 26 |
| [frontend/eslint.config.js](/frontend/eslint.config.js) | JavaScript | 22 | 0 | 2 | 24 |
| [frontend/index.html](/frontend/index.html) | HTML | 27 | 0 | 3 | 30 |
| [frontend/package-lock.json](/frontend/package-lock.json) | JSON | 13,611 | 0 | 1 | 13,612 |
| [frontend/package.json](/frontend/package.json) | JSON | 70 | 0 | 1 | 71 |
| [frontend/src/App.tsx](/frontend/src/App.tsx) | TypeScript JSX | 10 | 0 | 1 | 11 |
| [frontend/src/components/RichTextEditor.tsx](/frontend/src/components/RichTextEditor.tsx) | TypeScript JSX | 413 | 121 | 37 | 571 |
| [frontend/src/components/layout/ProtectedLayout.tsx](/frontend/src/components/layout/ProtectedLayout.tsx) | TypeScript JSX | 21 | 1 | 5 | 27 |
| [frontend/src/components/theme-provider.tsx](/frontend/src/components/theme-provider.tsx) | TypeScript JSX | 184 | 1 | 46 | 231 |
| [frontend/src/components/ui/alert-dialog.tsx](/frontend/src/components/ui/alert-dialog.tsx) | TypeScript JSX | 183 | 0 | 15 | 198 |
| [frontend/src/components/ui/badge.tsx](/frontend/src/components/ui/badge.tsx) | TypeScript JSX | 44 | 0 | 6 | 50 |
| [frontend/src/components/ui/button.tsx](/frontend/src/components/ui/button.tsx) | TypeScript JSX | 62 | 1 | 6 | 69 |
| [frontend/src/components/ui/card.tsx](/frontend/src/components/ui/card.tsx) | TypeScript JSX | 94 | 0 | 10 | 104 |
| [frontend/src/components/ui/checkbox.tsx](/frontend/src/components/ui/checkbox.tsx) | TypeScript JSX | 28 | 0 | 4 | 32 |
| [frontend/src/components/ui/context-menu.tsx](/frontend/src/components/ui/context-menu.tsx) | TypeScript JSX | 244 | 0 | 18 | 262 |
| [frontend/src/components/ui/dialog.tsx](/frontend/src/components/ui/dialog.tsx) | TypeScript JSX | 154 | 0 | 13 | 167 |
| [frontend/src/components/ui/dropdown-menu.tsx](/frontend/src/components/ui/dropdown-menu.tsx) | TypeScript JSX | 250 | 0 | 18 | 268 |
| [frontend/src/components/ui/field.tsx](/frontend/src/components/ui/field.tsx) | TypeScript JSX | 217 | 0 | 20 | 237 |
| [frontend/src/components/ui/input.tsx](/frontend/src/components/ui/input.tsx) | TypeScript JSX | 16 | 0 | 4 | 20 |
| [frontend/src/components/ui/label.tsx](/frontend/src/components/ui/label.tsx) | TypeScript JSX | 19 | 0 | 4 | 23 |
| [frontend/src/components/ui/popover.tsx](/frontend/src/components/ui/popover.tsx) | TypeScript JSX | 78 | 0 | 10 | 88 |
| [frontend/src/components/ui/radio-group.tsx](/frontend/src/components/ui/radio-group.tsx) | TypeScript JSX | 38 | 0 | 5 | 43 |
| [frontend/src/components/ui/select.tsx](/frontend/src/components/ui/select.tsx) | TypeScript JSX | 178 | 0 | 13 | 191 |
| [frontend/src/components/ui/separator.tsx](/frontend/src/components/ui/separator.tsx) | TypeScript JSX | 23 | 0 | 4 | 27 |
| [frontend/src/components/ui/slider.tsx](/frontend/src/components/ui/slider.tsx) | TypeScript JSX | 53 | 0 | 5 | 58 |
| [frontend/src/components/ui/sonner.tsx](/frontend/src/components/ui/sonner.tsx) | TypeScript JSX | 44 | 0 | 4 | 48 |
| [frontend/src/components/ui/tabs.tsx](/frontend/src/components/ui/tabs.tsx) | TypeScript JSX | 81 | 0 | 8 | 89 |
| [frontend/src/components/ui/textarea.tsx](/frontend/src/components/ui/textarea.tsx) | TypeScript JSX | 15 | 0 | 4 | 19 |
| [frontend/src/components/ui/tooltip.tsx](/frontend/src/components/ui/tooltip.tsx) | TypeScript JSX | 49 | 0 | 7 | 56 |
| [frontend/src/config/routes.ts](/frontend/src/config/routes.ts) | TypeScript | 3 | 0 | 1 | 4 |
| [frontend/src/contexts/AuthContext.tsx](/frontend/src/contexts/AuthContext.tsx) | TypeScript JSX | 53 | 2 | 9 | 64 |
| [frontend/src/form/components/ComponentRender.Helper.tsx](/frontend/src/form/components/ComponentRender.Helper.tsx) | TypeScript JSX | 30 | 1 | 5 | 36 |
| [frontend/src/form/components/PlaceholderRenderer.tsx](/frontend/src/form/components/PlaceholderRenderer.tsx) | TypeScript JSX | 39 | 7 | 6 | 52 |
| [frontend/src/form/components/allComponents.ts](/frontend/src/form/components/allComponents.ts) | TypeScript | 289 | 69 | 43 | 401 |
| [frontend/src/form/components/base.ts](/frontend/src/form/components/base.ts) | TypeScript | 167 | 85 | 32 | 284 |
| [frontend/src/form/components/comps/layout/Columns.tsx](/frontend/src/form/components/comps/layout/Columns.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/layout/ComponentStack.tsx](/frontend/src/form/components/comps/layout/ComponentStack.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/layout/Heading.tsx](/frontend/src/form/components/comps/layout/Heading.tsx) | TypeScript JSX | 79 | 3 | 9 | 91 |
| [frontend/src/form/components/comps/layout/LineDivider.tsx](/frontend/src/form/components/comps/layout/LineDivider.tsx) | TypeScript JSX | 83 | 2 | 8 | 93 |
| [frontend/src/form/components/comps/layout/Spacer.tsx](/frontend/src/form/components/comps/layout/Spacer.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/layout/TextBox.tsx](/frontend/src/form/components/comps/layout/TextBox.tsx) | TypeScript JSX | 69 | 2 | 9 | 80 |
| [frontend/src/form/components/comps/numeric-input/Decimal.tsx](/frontend/src/form/components/comps/numeric-input/Decimal.tsx) | TypeScript JSX | 215 | 1 | 19 | 235 |
| [frontend/src/form/components/comps/numeric-input/Number.tsx](/frontend/src/form/components/comps/numeric-input/Number.tsx) | TypeScript JSX | 194 | 1 | 15 | 210 |
| [frontend/src/form/components/comps/selection/Checkbox.tsx](/frontend/src/form/components/comps/selection/Checkbox.tsx) | TypeScript JSX | 354 | 8 | 32 | 394 |
| [frontend/src/form/components/comps/selection/Dropdown.tsx](/frontend/src/form/components/comps/selection/Dropdown.tsx) | TypeScript JSX | 278 | 3 | 25 | 306 |
| [frontend/src/form/components/comps/selection/Radio.tsx](/frontend/src/form/components/comps/selection/Radio.tsx) | TypeScript JSX | 295 | 13 | 24 | 332 |
| [frontend/src/form/components/comps/text-input/MultiLineText.tsx](/frontend/src/form/components/comps/text-input/MultiLineText.tsx) | TypeScript JSX | 154 | 14 | 12 | 180 |
| [frontend/src/form/components/comps/text-input/SingleLineText.tsx](/frontend/src/form/components/comps/text-input/SingleLineText.tsx) | TypeScript JSX | 209 | 2 | 14 | 225 |
| [frontend/src/form/components/comps/wip/AddressBlock.tsx](/frontend/src/form/components/comps/wip/AddressBlock.tsx) | TypeScript JSX | 287 | 4 | 23 | 314 |
| [frontend/src/form/components/comps/wip/Captcha.tsx](/frontend/src/form/components/comps/wip/Captcha.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/ColorPicker.tsx](/frontend/src/form/components/comps/wip/ColorPicker.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/Date.tsx](/frontend/src/form/components/comps/wip/Date.tsx) | TypeScript JSX | 175 | 18 | 19 | 212 |
| [frontend/src/form/components/comps/wip/Email.tsx](/frontend/src/form/components/comps/wip/Email.tsx) | TypeScript JSX | 195 | 2 | 13 | 210 |
| [frontend/src/form/components/comps/wip/FileUpload.tsx](/frontend/src/form/components/comps/wip/FileUpload.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/ImageUpload.tsx](/frontend/src/form/components/comps/wip/ImageUpload.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/LinearScale.tsx](/frontend/src/form/components/comps/wip/LinearScale.tsx) | TypeScript JSX | 276 | 1 | 19 | 296 |
| [frontend/src/form/components/comps/wip/Location.tsx](/frontend/src/form/components/comps/wip/Location.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/MatrixTable.tsx](/frontend/src/form/components/comps/wip/MatrixTable.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/MultiChoiceGrid.tsx](/frontend/src/form/components/comps/wip/MultiChoiceGrid.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/NameBlock.tsx](/frontend/src/form/components/comps/wip/NameBlock.tsx) | TypeScript JSX | 237 | 5 | 21 | 263 |
| [frontend/src/form/components/comps/wip/Phone.tsx](/frontend/src/form/components/comps/wip/Phone.tsx) | TypeScript JSX | 261 | 8 | 23 | 292 |
| [frontend/src/form/components/comps/wip/RatingScale.tsx](/frontend/src/form/components/comps/wip/RatingScale.tsx) | TypeScript JSX | 241 | 6 | 19 | 266 |
| [frontend/src/form/components/comps/wip/RichTextInput.tsx](/frontend/src/form/components/comps/wip/RichTextInput.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/Signature.tsx](/frontend/src/form/components/comps/wip/Signature.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/SingleChoiceGrid.tsx](/frontend/src/form/components/comps/wip/SingleChoiceGrid.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/Slider.tsx](/frontend/src/form/components/comps/wip/Slider.tsx) | TypeScript JSX | 264 | 4 | 20 | 288 |
| [frontend/src/form/components/comps/wip/Time.tsx](/frontend/src/form/components/comps/wip/Time.tsx) | TypeScript JSX | 193 | 3 | 17 | 213 |
| [frontend/src/form/components/comps/wip/Toggle.tsx](/frontend/src/form/components/comps/wip/Toggle.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/form/components/comps/wip/URL.tsx](/frontend/src/form/components/comps/wip/URL.tsx) | TypeScript JSX | 200 | 18 | 16 | 234 |
| [frontend/src/form/context/FormModeContext.tsx](/frontend/src/form/context/FormModeContext.tsx) | TypeScript JSX | 5 | 2 | 4 | 11 |
| [frontend/src/form/hooks/useFormDragHandlers.ts](/frontend/src/form/hooks/useFormDragHandlers.ts) | TypeScript | 407 | 37 | 63 | 507 |
| [frontend/src/form/logic/formLogicEngine.ts](/frontend/src/form/logic/formLogicEngine.ts) | TypeScript | 237 | 18 | 35 | 290 |
| [frontend/src/form/logic/logic.store.ts](/frontend/src/form/logic/logic.store.ts) | TypeScript | 276 | 33 | 48 | 357 |
| [frontend/src/form/logic/logicTypes.ts](/frontend/src/form/logic/logicTypes.ts) | TypeScript | 175 | 29 | 36 | 240 |
| [frontend/src/form/registry/componentRegistry.ts](/frontend/src/form/registry/componentRegistry.ts) | TypeScript | 328 | 24 | 53 | 405 |
| [frontend/src/form/renderer/SelectableWrapper.tsx](/frontend/src/form/renderer/SelectableWrapper.tsx) | TypeScript JSX | 589 | 66 | 53 | 708 |
| [frontend/src/form/renderer/editRenderer/RenderComponent.tsx](/frontend/src/form/renderer/editRenderer/RenderComponent.tsx) | TypeScript JSX | 51 | 7 | 7 | 65 |
| [frontend/src/form/renderer/editRenderer/RenderForm.tsx](/frontend/src/form/renderer/editRenderer/RenderForm.tsx) | TypeScript JSX | 151 | 27 | 20 | 198 |
| [frontend/src/form/renderer/editRenderer/RenderPage.tsx](/frontend/src/form/renderer/editRenderer/RenderPage.tsx) | TypeScript JSX | 84 | 1 | 8 | 93 |
| [frontend/src/form/renderer/viewRenderer/FormRunner.tsx](/frontend/src/form/renderer/viewRenderer/FormRunner.tsx) | TypeScript JSX | 333 | 64 | 54 | 451 |
| [frontend/src/form/renderer/viewRenderer/runtimeForm.store.ts](/frontend/src/form/renderer/viewRenderer/runtimeForm.store.ts) | TypeScript | 130 | 114 | 36 | 280 |
| [frontend/src/form/renderer/viewRenderer/runtimeForm.types.ts](/frontend/src/form/renderer/viewRenderer/runtimeForm.types.ts) | TypeScript | 48 | 33 | 10 | 91 |
| [frontend/src/form/store/form.store.ts](/frontend/src/form/store/form.store.ts) | TypeScript | 638 | 127 | 126 | 891 |
| [frontend/src/form/store/formSerialization.ts](/frontend/src/form/store/formSerialization.ts) | TypeScript | 44 | 12 | 7 | 63 |
| [frontend/src/form/store/group.store.ts](/frontend/src/form/store/group.store.ts) | TypeScript | 36 | 1 | 5 | 42 |
| [frontend/src/form/theme/FormThemeProvider.tsx](/frontend/src/form/theme/FormThemeProvider.tsx) | TypeScript JSX | 178 | 13 | 25 | 216 |
| [frontend/src/form/theme/formTheme.ts](/frontend/src/form/theme/formTheme.ts) | TypeScript | 78 | 4 | 5 | 87 |
| [frontend/src/form/theme/theme.store.ts](/frontend/src/form/theme/theme.store.ts) | TypeScript | 48 | 6 | 10 | 64 |
| [frontend/src/form/utils/DndUtils.tsx](/frontend/src/form/utils/DndUtils.tsx) | TypeScript JSX | 13 | 3 | 3 | 19 |
| [frontend/src/lib/api.ts](/frontend/src/lib/api.ts) | TypeScript | 39 | 1 | 8 | 48 |
| [frontend/src/lib/firebase.ts](/frontend/src/lib/firebase.ts) | TypeScript | 15 | 1 | 4 | 20 |
| [frontend/src/lib/formApi.ts](/frontend/src/lib/formApi.ts) | TypeScript | 317 | 2 | 34 | 353 |
| [frontend/src/lib/frontendBackendCompArray.ts](/frontend/src/lib/frontendBackendCompArray.ts) | TypeScript | 36 | 2 | 3 | 41 |
| [frontend/src/lib/utils.ts](/frontend/src/lib/utils.ts) | TypeScript | 5 | 0 | 2 | 7 |
| [frontend/src/main.tsx](/frontend/src/main.tsx) | TypeScript JSX | 17 | 0 | 3 | 20 |
| [frontend/src/pages/AccountPage.tsx](/frontend/src/pages/AccountPage.tsx) | TypeScript JSX | 100 | 3 | 10 | 113 |
| [frontend/src/pages/ActivityPage.tsx](/frontend/src/pages/ActivityPage.tsx) | TypeScript JSX | 229 | 3 | 15 | 247 |
| [frontend/src/pages/Dashboard/Dashboard.tsx](/frontend/src/pages/Dashboard/Dashboard.tsx) | TypeScript JSX | 121 | 4 | 15 | 140 |
| [frontend/src/pages/Dashboard/components/DashboardHeader.tsx](/frontend/src/pages/Dashboard/components/DashboardHeader.tsx) | TypeScript JSX | 74 | 0 | 5 | 79 |
| [frontend/src/pages/Dashboard/components/MyFormsTab.tsx](/frontend/src/pages/Dashboard/components/MyFormsTab.tsx) | TypeScript JSX | 426 | 10 | 26 | 462 |
| [frontend/src/pages/Dashboard/components/SharedFormsTab.tsx](/frontend/src/pages/Dashboard/components/SharedFormsTab.tsx) | TypeScript JSX | 350 | 304 | 34 | 688 |
| [frontend/src/pages/Dashboard/components/SubmissionDetails.tsx](/frontend/src/pages/Dashboard/components/SubmissionDetails.tsx) | TypeScript JSX | 131 | 96 | 13 | 240 |
| [frontend/src/pages/Dashboard/components/SubmissionsTab.tsx](/frontend/src/pages/Dashboard/components/SubmissionsTab.tsx) | TypeScript JSX | 182 | 3 | 16 | 201 |
| [frontend/src/pages/Dashboard/components/TemplatesSection.tsx](/frontend/src/pages/Dashboard/components/TemplatesSection.tsx) | TypeScript JSX | 86 | 3 | 9 | 98 |
| [frontend/src/pages/Dashboard/dashboard.types.ts](/frontend/src/pages/Dashboard/dashboard.types.ts) | TypeScript | 27 | 0 | 3 | 30 |
| [frontend/src/pages/Dashboard/dashboard.utils.ts](/frontend/src/pages/Dashboard/dashboard.utils.ts) | TypeScript | 38 | 0 | 4 | 42 |
| [frontend/src/pages/EditorThemeTemplatesPage.tsx](/frontend/src/pages/EditorThemeTemplatesPage.tsx) | TypeScript JSX | 82 | 3 | 7 | 92 |
| [frontend/src/pages/FormEditor/FormEditorLayout.tsx](/frontend/src/pages/FormEditor/FormEditorLayout.tsx) | TypeScript JSX | 156 | 13 | 28 | 197 |
| [frontend/src/pages/FormEditor/FormEditorLoader.tsx](/frontend/src/pages/FormEditor/FormEditorLoader.tsx) | TypeScript JSX | 9 | 0 | 3 | 12 |
| [frontend/src/pages/FormEditor/FormEditorPage.tsx](/frontend/src/pages/FormEditor/FormEditorPage.tsx) | TypeScript JSX | 6 | 0 | 1 | 7 |
| [frontend/src/pages/FormEditor/FormEditorShell.tsx](/frontend/src/pages/FormEditor/FormEditorShell.tsx) | TypeScript JSX | 21 | 0 | 3 | 24 |
| [frontend/src/pages/FormEditor/KeyboardShortcutsHelp.tsx](/frontend/src/pages/FormEditor/KeyboardShortcutsHelp.tsx) | TypeScript JSX | 134 | 0 | 7 | 141 |
| [frontend/src/pages/FormEditor/components/ActionRow.tsx](/frontend/src/pages/FormEditor/components/ActionRow.tsx) | TypeScript JSX | 66 | 8 | 9 | 83 |
| [frontend/src/pages/FormEditor/components/ComponentCatalogPanel.tsx](/frontend/src/pages/FormEditor/components/ComponentCatalogPanel.tsx) | TypeScript JSX | 199 | 31 | 13 | 243 |
| [frontend/src/pages/FormEditor/components/ComponentPropertiesPanel.tsx](/frontend/src/pages/FormEditor/components/ComponentPropertiesPanel.tsx) | TypeScript JSX | 191 | 45 | 26 | 262 |
| [frontend/src/pages/FormEditor/components/ConditionBuilder.tsx](/frontend/src/pages/FormEditor/components/ConditionBuilder.tsx) | TypeScript JSX | 291 | 17 | 27 | 335 |
| [frontend/src/pages/FormEditor/components/DebugPanel.tsx](/frontend/src/pages/FormEditor/components/DebugPanel.tsx) | TypeScript JSX | 67 | 2 | 7 | 76 |
| [frontend/src/pages/FormEditor/components/DependencyGraph.tsx](/frontend/src/pages/FormEditor/components/DependencyGraph.tsx) | TypeScript JSX | 124 | 12 | 18 | 154 |
| [frontend/src/pages/FormEditor/components/EditorSidebar.tsx](/frontend/src/pages/FormEditor/components/EditorSidebar.tsx) | TypeScript JSX | 62 | 6 | 6 | 74 |
| [frontend/src/pages/FormEditor/components/FormCanvas.tsx](/frontend/src/pages/FormEditor/components/FormCanvas.tsx) | TypeScript JSX | 121 | 3 | 13 | 137 |
| [frontend/src/pages/FormEditor/components/FormPropertiesPanel.tsx](/frontend/src/pages/FormEditor/components/FormPropertiesPanel.tsx) | TypeScript JSX | 258 | 20 | 23 | 301 |
| [frontend/src/pages/FormEditor/components/FormulaEditor.tsx](/frontend/src/pages/FormEditor/components/FormulaEditor.tsx) | TypeScript JSX | 241 | 11 | 33 | 285 |
| [frontend/src/pages/FormEditor/components/GroupCatalogPanel.tsx](/frontend/src/pages/FormEditor/components/GroupCatalogPanel.tsx) | TypeScript JSX | 83 | 0 | 7 | 90 |
| [frontend/src/pages/FormEditor/components/LogicPanel.tsx](/frontend/src/pages/FormEditor/components/LogicPanel.tsx) | TypeScript JSX | 540 | 0 | 29 | 569 |
| [frontend/src/pages/FormEditor/components/LogicPlayground.tsx](/frontend/src/pages/FormEditor/components/LogicPlayground.tsx) | TypeScript JSX | 383 | 24 | 24 | 431 |
| [frontend/src/pages/FormEditor/components/PageNavigator.tsx](/frontend/src/pages/FormEditor/components/PageNavigator.tsx) | TypeScript JSX | 94 | 7 | 11 | 112 |
| [frontend/src/pages/FormEditor/components/PreviewPublishPanel.tsx](/frontend/src/pages/FormEditor/components/PreviewPublishPanel.tsx) | TypeScript JSX | 14 | 1 | 2 | 17 |
| [frontend/src/pages/FormEditor/components/RightFloatingPanel.tsx](/frontend/src/pages/FormEditor/components/RightFloatingPanel.tsx) | TypeScript JSX | 61 | 9 | 8 | 78 |
| [frontend/src/pages/FormEditor/components/TemplateCatalogPanel.tsx](/frontend/src/pages/FormEditor/components/TemplateCatalogPanel.tsx) | TypeScript JSX | 14 | 1 | 2 | 17 |
| [frontend/src/pages/FormEditor/components/ThemePanel.tsx](/frontend/src/pages/FormEditor/components/ThemePanel.tsx) | TypeScript JSX | 21 | 5 | 2 | 28 |
| [frontend/src/pages/FormEditor/components/ThemingPage.tsx](/frontend/src/pages/FormEditor/components/ThemingPage.tsx) | TypeScript JSX | 1,003 | 63 | 77 | 1,143 |
| [frontend/src/pages/FormEditor/components/Workspaces.tsx](/frontend/src/pages/FormEditor/components/Workspaces.tsx) | TypeScript JSX | 344 | 28 | 25 | 397 |
| [frontend/src/pages/FormEditor/components/wip/AIPanel.tsx](/frontend/src/pages/FormEditor/components/wip/AIPanel.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/pages/FormEditor/components/wip/TemplatePanel.tsx](/frontend/src/pages/FormEditor/components/wip/TemplatePanel.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/pages/FormEditor/components/wip/ThemePanel.tsx](/frontend/src/pages/FormEditor/components/wip/ThemePanel.tsx) | TypeScript JSX | 0 | 0 | 1 | 1 |
| [frontend/src/pages/FormEditor/hooks/useFormEditorController.ts](/frontend/src/pages/FormEditor/hooks/useFormEditorController.ts) | TypeScript | 159 | 20 | 43 | 222 |
| [frontend/src/pages/FormEditor/hooks/useFormEditorHydration.ts](/frontend/src/pages/FormEditor/hooks/useFormEditorHydration.ts) | TypeScript | 62 | 0 | 13 | 75 |
| [frontend/src/pages/FormEditor/legacy/FormEditor.tsx](/frontend/src/pages/FormEditor/legacy/FormEditor.tsx) | TypeScript JSX | 579 | 36 | 52 | 667 |
| [frontend/src/pages/FormEditor/overlays/EditorDragOverlay.tsx](/frontend/src/pages/FormEditor/overlays/EditorDragOverlay.tsx) | TypeScript JSX | 6 | 0 | 3 | 9 |
| [frontend/src/pages/FormEditor/useFormEditorShortcuts.ts](/frontend/src/pages/FormEditor/useFormEditorShortcuts.ts) | TypeScript | 342 | 27 | 42 | 411 |
| [frontend/src/pages/FormFill/FillFieldRenderer.tsx](/frontend/src/pages/FormFill/FillFieldRenderer.tsx) | TypeScript JSX | 430 | 0 | 22 | 452 |
| [frontend/src/pages/FormFill/FormFill.tsx](/frontend/src/pages/FormFill/FormFill.tsx) | TypeScript JSX | 508 | 0 | 48 | 556 |
| [frontend/src/pages/FormFill/FormPreview.tsx](/frontend/src/pages/FormFill/FormPreview.tsx) | TypeScript JSX | 153 | 0 | 15 | 168 |
| [frontend/src/pages/FormFill/FormSuccess.tsx](/frontend/src/pages/FormFill/FormSuccess.tsx) | TypeScript JSX | 25 | 1 | 4 | 30 |
| [frontend/src/pages/FormFill/runtimeLogic.ts](/frontend/src/pages/FormFill/runtimeLogic.ts) | TypeScript | 486 | 1 | 40 | 527 |
| [frontend/src/pages/FormReview/FormReview.tsx](/frontend/src/pages/FormReview/FormReview.tsx) | TypeScript JSX | 365 | 0 | 34 | 399 |
| [frontend/src/pages/FormSubmit/FormSubmit.tsx](/frontend/src/pages/FormSubmit/FormSubmit.tsx) | TypeScript JSX | 8 | 0 | 2 | 10 |
| [frontend/src/pages/KeyboardShortcutsPage.tsx](/frontend/src/pages/KeyboardShortcutsPage.tsx) | TypeScript JSX | 425 | 0 | 14 | 439 |
| [frontend/src/pages/Login/page.tsx](/frontend/src/pages/Login/page.tsx) | TypeScript JSX | 79 | 1 | 11 | 91 |
| [frontend/src/pages/NotificationSettingsPage.tsx](/frontend/src/pages/NotificationSettingsPage.tsx) | TypeScript JSX | 138 | 2 | 13 | 153 |
| [frontend/src/pages/UserSettingsPage.tsx](/frontend/src/pages/UserSettingsPage.tsx) | TypeScript JSX | 215 | 6 | 13 | 234 |
| [frontend/src/routes/formRoutes.tsx](/frontend/src/routes/formRoutes.tsx) | TypeScript JSX | 17 | 0 | 1 | 18 |
| [frontend/src/routes/index.ts](/frontend/src/routes/index.ts) | TypeScript | 6 | 0 | 1 | 7 |
| [frontend/src/routes/protectedRoutes.tsx](/frontend/src/routes/protectedRoutes.tsx) | TypeScript JSX | 21 | 0 | 2 | 23 |
| [frontend/src/routes/publicRoutes.tsx](/frontend/src/routes/publicRoutes.tsx) | TypeScript JSX | 22 | 0 | 1 | 23 |
| [frontend/src/routes/settingsRoutes.tsx](/frontend/src/routes/settingsRoutes.tsx) | TypeScript JSX | 27 | 0 | 1 | 28 |
| [frontend/src/styles/font-theme.css](/frontend/src/styles/font-theme.css) | PostCSS | 69 | 5 | 6 | 80 |
| [frontend/src/styles/form-theme.css](/frontend/src/styles/form-theme.css) | PostCSS | 557 | 69 | 49 | 675 |
| [frontend/src/styles/index.css](/frontend/src/styles/index.css) | PostCSS | 135 | 1 | 12 | 148 |
| [frontend/src/styles/theming-page.css](/frontend/src/styles/theming-page.css) | PostCSS | 264 | 21 | 21 | 306 |
| [frontend/tsconfig.app.json](/frontend/tsconfig.app.json) | JSON | 28 | 2 | 3 | 33 |
| [frontend/tsconfig.json](/frontend/tsconfig.json) | JSON with Comments | 13 | 0 | 1 | 14 |
| [frontend/tsconfig.node.json](/frontend/tsconfig.node.json) | JSON | 22 | 2 | 3 | 27 |
| [frontend/vercel.json](/frontend/vercel.json) | JSON | 5 | 0 | 1 | 6 |
| [frontend/vite.config.ts](/frontend/vite.config.ts) | TypeScript | 12 | 1 | 2 | 15 |

[Summary](results.md) / Details / [Diff Summary](diff.md) / [Diff Details](diff-details.md)