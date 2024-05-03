/**
 * Utility module for evaluating expressions.
 * @packageDocumentation
 */

import Mexp from "math-expression-evaluator";

const mexp = new Mexp();

/**
 * Tries to evaluate the given mathematical expression and returns the result or null if an error occurs.
 * @param expression - The potential mathematical expression to evaluate.
 * @returns The result of the evaluation, or null if an error occurs.
 */
export function evaluateExpression(expression: string): number | null {
  let result;
  try {
    result = mexp.eval(expression)
  } catch (error) {
    result = null;
  }
  return result;
}
