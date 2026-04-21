// frontend/translator.ts
import { nanoid } from 'nanoid';
import { useLogicStore } from '../logic/logic.store';
import type {
  ConditionLeaf,
  ConditionGroup,
  RuleAction,
} from '../logic/logicTypes';
import { useFormStore } from '../store/form.store';
import { createSingleLineInputComponent } from '../components/comps/SingleLineInput';
import { createRadioComponent } from '../components/comps/Radio';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function executeAIActionStream(payload: any) {
  console.group(
    `[executeAIActionStream] Starting execution for form: "${payload.formName}"`
  );

  const {
    addPage,
    addComponent,
    updateFormName,
    updatePageTitle,
    updatePageTerminal,
    updatePageNextPage,
  } = useFormStore.getState();
  const { addRule, updateRuleCondition, updateRuleThenActions } =
    useLogicStore.getState();

  updateFormName(payload.formName);
  const idMap = new Map<string, string>();
  const componentToPageMap = new Map<string, string>();

  // ==========================================
  // PASS 1: Generate All Pages First
  // ==========================================
  console.log('--- PASS 1: PAGES ---');
  // Collect (realPageId → nextPageTempId) pairs to resolve after all pages are created
  const pendingNextPageLinks: Array<{
    realPageId: string;
    nextPageTempId: string;
  }> = [];

  payload.operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((op: any) => op.action === 'ADD_PAGE')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((op: any, index: number) => {
      const realPageId = nanoid();
      idMap.set(op.tempId, realPageId);
      console.log(
        `[Page ${index + 1}] Created: "${op.title}" (mapped ${op.tempId} -> ${realPageId})`
      );
      addPage(undefined, realPageId);
      if (updatePageTitle && op.title) {
        updatePageTitle(realPageId, op.title);
      }
      // Mark the page as terminal (Submit page) if the AI flagged it
      if (op.terminalPage === true) {
        updatePageTerminal(realPageId, true);
      }
      // Collect nextPageId for resolution after all pages are registered in idMap
      if (op.nextPageId) {
        pendingNextPageLinks.push({
          realPageId,
          nextPageTempId: op.nextPageId,
        });
      }
    });

  // Resolve nextPageId references now that all pages are in the idMap
  pendingNextPageLinks.forEach(({ realPageId, nextPageTempId }) => {
    const realNextPageId = idMap.get(nextPageTempId);
    if (realNextPageId) {
      updatePageNextPage(realPageId, realNextPageId);
      console.log(
        `[Page] Wired defaultNextPage: ${realPageId} -> ${realNextPageId}`
      );
    } else {
      console.warn(
        `[Page] nextPageId "${nextPageTempId}" not found in idMap — skipping.`
      );
    }
  });

  // ==========================================
  // PASS 2: Generate All Components
  // ==========================================
  console.log('--- PASS 2: COMPONENTS ---');
  payload.operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((op: any) => op.action === 'ADD_COMPONENT')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((op: any, index: number) => {
      const realCompId = nanoid();
      idMap.set(op.tempId, realCompId);
      const realPageId = idMap.get(op.targetPageId);

      if (!realPageId) {
        console.warn(
          `[Comp ${index + 1}] Failed: Target page "${op.targetPageId}" not found!`
        );
        return;
      }

      console.log(
        `[Comp ${index + 1}] Created: "${op.label}" on page ${realPageId}`
      );
      componentToPageMap.set(realCompId, realPageId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let newComponent: any = null;

      if (op.componentType === 'SingleLineInput') {
        newComponent = createSingleLineInputComponent(
          realCompId,
          { label: op.label },
          op.props
        );
      } else if (op.componentType === 'Radio') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const realOptions = op.props.options.map((opt: any) => ({
          id: nanoid(),
          value: opt.value,
        }));
        newComponent = createRadioComponent(
          realCompId,
          { label: op.label },
          { ...op.props, options: realOptions }
        );
      }

      if (newComponent) {
        newComponent.validation = op.validation;
        addComponent(realPageId, newComponent);
      }
    });

  // ==========================================
  // PASS 3: Generate All Skip Logic
  // ==========================================
  console.log('--- PASS 3: LOGIC ---');
  payload.operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((op: any) => op.action === 'ADD_SKIP_LOGIC')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((op: any, index: number) => {
      const realSourceId = idMap.get(op.sourceFieldId);
      const realTargetPageId = idMap.get(op.targetPageId);

      if (!realSourceId || !realTargetPageId) {
        console.warn(
          `[Logic ${index + 1}] Failed: Missing mapping. Source: ${realSourceId}, Target: ${realTargetPageId}`
        );
        return;
      }

      const originPageId = componentToPageMap.get(realSourceId);
      if (!originPageId) return;

      console.log(
        `[Logic ${index + 1}] Wired: If ${realSourceId} ${op.operator} '${op.value}' -> Skip to ${realTargetPageId}`
      );

      const ruleId = addRule(
        `AI Logic: Skip to ${op.targetPageId}`,
        'navigation',
        realSourceId
      );

      const leafCondition: ConditionLeaf = {
        type: 'leaf',
        id: nanoid(),
        instanceId: realSourceId,
        operator: op.operator,
        value: op.value || '',
      };

      const groupCondition: ConditionGroup = {
        type: 'group',
        id: nanoid(),
        operator: 'AND',
        conditions: [leafCondition],
      };

      const skipAction: RuleAction = {
        id: nanoid(),
        type: 'SKIP_PAGE',
        targetId: originPageId,
        toPageId: realTargetPageId,
      };

      updateRuleCondition(ruleId, groupCondition);
      updateRuleThenActions(ruleId, [skipAction]);
    });

  // ==========================================
  // PASS 4: Generate Visibility (Show/Hide) Logic
  // ==========================================
  console.log('--- PASS 4: VISIBILITY LOGIC ---');
  payload.operations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((op: any) => op.action === 'ADD_VISIBILITY_LOGIC')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .forEach((op: any, index: number) => {
      const realSourceId = idMap.get(op.sourceFieldId);
      const realTargetId = idMap.get(op.targetFieldId);

      if (!realSourceId || !realTargetId) {
        console.warn(
          `[Visibility ${index + 1}] Failed: Missing mapping. Source: ${realSourceId}, Target: ${realTargetId}`
        );
        return;
      }

      console.log(
        `[Visibility ${index + 1}] Wired: If ${realSourceId} ${op.operator} '${op.value ?? ''}' → ${op.thenAction} ${realTargetId}`
      );

      const ruleId = addRule(
        `AI Visibility: ${op.thenAction} on condition`,
        'field',
        realSourceId
      );

      const leafCondition: ConditionLeaf = {
        type: 'leaf',
        id: nanoid(),
        instanceId: realSourceId,
        operator: op.operator,
        value: op.value ?? '',
      };

      const groupCondition: ConditionGroup = {
        type: 'group',
        id: nanoid(),
        operator: 'AND',
        conditions: [leafCondition],
      };

      // thenAction is 'SHOW' or 'HIDE' — both are valid ActionType values
      const visibilityAction: RuleAction = {
        id: nanoid(),
        type: op.thenAction as 'SHOW' | 'HIDE',
        targetId: realTargetId,
      };

      updateRuleCondition(ruleId, groupCondition);
      updateRuleThenActions(ruleId, [visibilityAction]);
    });

  console.log(`[executeAIActionStream] Finished executing AI action stream.`);
  console.groupEnd();
}
