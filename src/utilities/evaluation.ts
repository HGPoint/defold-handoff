import Mexp from "math-expression-evaluator";

const mexp = new Mexp();

export function evaluateExpression(expression: string): number | null {
  let result;
  try {
    result = mexp.eval(expression)
  } catch (error) {
    result = null;
  }
  return result;
}