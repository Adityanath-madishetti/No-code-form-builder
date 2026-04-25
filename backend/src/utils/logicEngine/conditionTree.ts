// backend/src/utils/logicEngine/conditionTree.ts

import { toNumber, toText } from './helpers.js';

function evaluateLeaf(leaf: any, values: Record<string, any>): boolean {
  const { instanceId, operator, value: targetValue } = leaf;
  const actualValue = values[instanceId];

  switch (operator) {
    case 'equals':
      return String(actualValue) === String(targetValue);
    case 'not_equals':
      return String(actualValue) !== String(targetValue);
    case 'contains':
      return toText(actualValue).includes(toText(targetValue));
    case 'not_contains':
      return !toText(actualValue).includes(toText(targetValue));
    case 'greater_than':
      return toNumber(actualValue) > toNumber(targetValue);
    case 'less_than':
      return toNumber(actualValue) < toNumber(targetValue);
    case 'greater_than_equals':
      return toNumber(actualValue) >= toNumber(targetValue);
    case 'less_than_equals':
      return toNumber(actualValue) <= toNumber(targetValue);
    case 'is_empty':
      return actualValue === null || actualValue === undefined || String(actualValue).trim() === '';
    case 'is_not_empty':
      return actualValue !== null && actualValue !== undefined && String(actualValue).trim() !== '';
    default:
      return false;
  }
}

export function evaluateConditionTree(node: any, values: Record<string, any>): boolean {
  if (!node) return true;

  if (node.type === 'leaf') {
    return evaluateLeaf(node, values);
  }

  if (node.type === 'group') {
    const { operator, conditions = [] } = node;
    if (conditions.length === 0) return true;

    if (operator === 'OR') {
      return conditions.some((child: any) => evaluateConditionTree(child, values));
    }
    // Default to AND
    return conditions.every((child: any) => evaluateConditionTree(child, values));
  }

  return true;
}
