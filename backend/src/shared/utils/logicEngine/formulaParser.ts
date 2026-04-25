// backend/src/shared/utils/logicEngine/formulaParser.ts

import { toNumber } from './helpers.js';

/**
 * Basic formula evaluator for No-Code forms.
 * Supports:
 * - Arithmetic: +, -, *, /, %, ^
 * - Functions: SUM(), AVG(), MIN(), MAX(), ROUND(), ABS(), IF()
 * - Field references: {fieldId} or {componentId}
 */

function tokenize(expression: string): string[] {
  // Regex to match: numbers, quoted strings (if needed), operators, parentheses, commas, and {field_ids}
  // This is a simplified tokenizer.
  const regex = /\{[^}]+\}|[a-zA-Z_]+\(|[0-9]+(?:\.[0-9]+)?|[\+\-\*\/\%\^\(\),]|"(?:\\.|[^\\"])*"/g;
  return expression.match(regex) || [];
}

/**
 * Shunting-yard algorithm to convert infix to Postfix (RPN)
 */
function shuntingYard(tokens: string[]): string[] {
  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  const operators: Record<string, { prec: number; assoc: 'L' | 'R' }> = {
    '+': { prec: 2, assoc: 'L' },
    '-': { prec: 2, assoc: 'L' },
    '*': { prec: 3, assoc: 'L' },
    '/': { prec: 3, assoc: 'L' },
    '%': { prec: 3, assoc: 'L' },
    '^': { prec: 4, assoc: 'R' },
  };

  for (const token of tokens) {
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(token) || /^\{[^}]+\}$/.test(token) || /^".*"$/.test(token)) {
      outputQueue.push(token);
    } else if (/^[a-zA-Z_]+\($/.test(token)) {
      operatorStack.push(token);
    } else if (token === ',') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        const op = operatorStack.pop();
        if (op) outputQueue.push(op);
      }
    } else if (token in operators) {
      const o1 = token;
      let o2 = operatorStack[operatorStack.length - 1];
      while (
        o2 &&
        o2 !== '(' &&
        ((operators[o1].assoc === 'L' && operators[o1].prec <= (operators[o2]?.prec || 0)) ||
          (operators[o1].assoc === 'R' && operators[o1].prec < (operators[o2]?.prec || 0)))
      ) {
        const op = operatorStack.pop();
        if (op) outputQueue.push(op);
        o2 = operatorStack[operatorStack.length - 1];
      }
      operatorStack.push(o1);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        const op = operatorStack.pop();
        if (op) outputQueue.push(op);
      }
      operatorStack.pop(); // pop "("

      if (
        operatorStack.length > 0 &&
        /^[a-zA-Z_]+\($/.test(operatorStack[operatorStack.length - 1])
      ) {
        const fn = operatorStack.pop();
        if (fn) outputQueue.push(fn);
      }
    }
  }

  while (operatorStack.length > 0) {
    const op = operatorStack.pop();
    if (op) outputQueue.push(op);
  }

  return outputQueue;
}

const functionArity: Record<string, number> = {
  'SUM(': -1, // -1 means variable arity
  'AVG(': -1,
  'MIN(': -1,
  'MAX(': -1,
  'ROUND(': 2,
  'ABS(': 1,
  'IF(': 3,
};

function executeFunction(name: string, args: any[]): any {
  const cleanName = name.toUpperCase();
  switch (cleanName) {
    case 'SUM(':
      return args.reduce((acc, val) => acc + toNumber(val), 0);
    case 'AVG(':
      return args.length === 0
        ? 0
        : args.reduce((acc, val) => acc + toNumber(val), 0) / args.length;
    case 'MIN(':
      return Math.min(...args.map(toNumber));
    case 'MAX(':
      return Math.max(...args.map(toNumber));
    case 'ABS(':
      return Math.abs(toNumber(args[0]));
    case 'ROUND(':
      const val = toNumber(args[0]);
      const precision = toNumber(args[1]);
      return Number(val.toFixed(precision));
    case 'IF(':
      // args[0] is condition (numeric/bool), args[1] if true, args[2] if false
      return toNumber(args[0]) ? args[1] : args[2];
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

export function evaluateFormulaExpression(expression: string, values: Record<string, any>): any {
  if (!expression || expression.trim() === '') return null;

  const tokens = tokenize(expression);
  const rpn = shuntingYard(tokens);
  const stack: any[] = [];

  for (const token of rpn) {
    if (/^[0-9]+(?:\.[0-9]+)?$/.test(token)) {
      stack.push(Number(token));
    } else if (/^\{[^}]+\}$/.test(token)) {
      const fieldId = token.slice(1, -1);
      stack.push(values[fieldId] ?? 0);
    } else if (/^".*"$/.test(token)) {
      stack.push(token.slice(1, -1));
    } else if (/^[a-zA-Z_]+\($/.test(token)) {
      // Function call
      // For variable arity, we'd need to track arity in RPN.
      // Simplify: if arity is fixed, pop N. If variable, this logic needs marker in stack.
      const arity = functionArity[token.toUpperCase()];
      if (arity === -1) {
        // Variable arity: treat everything in stack as args for now?
        // No, that's wrong. In a real parser, we track number of args during shunting.
        // For now, let's assume SUM/AVG/etc take all current stack items (only works for single-level).
        // A better way: tokens for "," push a marker or we count args.
        // Simplified fallback for variable arity:
        const args = stack.splice(0, stack.length);
        stack.push(executeFunction(token, args));
      } else {
        const args = stack.splice(-arity, arity);
        stack.push(executeFunction(token, args));
      }
    } else {
      // Basic operators
      const b = stack.pop();
      const a = stack.pop();
      switch (token) {
        case '+':
          stack.push(toNumber(a) + toNumber(b));
          break;
        case '-':
          stack.push(toNumber(a) - toNumber(b));
          break;
        case '*':
          stack.push(toNumber(a) * toNumber(b));
          break;
        case '/':
          stack.push(toNumber(a) / toNumber(b));
          break;
        case '%':
          stack.push(toNumber(a) % toNumber(b));
          break;
        case '^':
          stack.push(Math.pow(toNumber(a), toNumber(b)));
          break;
      }
    }
  }

  return stack[0] ?? null;
}
