/**
 * Handles evaluating math expressions using math-expression-evaluator
 * @packageDocumentation
 */

import Mexp from "math-expression-evaluator";

const mexp = new Mexp();

/**
 * Attempts to evaluate a mathematical expression.
 * @param expression - The mathematical expression to evaluate.
 * @returns The result of the evaluation, or null if the expression is invalid.
 */
export default function evaluateExpression(expression: string): WithNull<number> {
  let result: WithNull<number>;
  try {
    result = mexp.eval(expression)
  } catch (error) {
    result = null;
  }
  return result;
}