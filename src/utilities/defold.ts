/**
 * Handles operations with Defold's component text format.
 */

import { splitByLines, joinLines } from "utilities/text";

const INDENTATION = "  ";

/**
 * Indents each line of the Defold's component text structure.
 * @param data - The Defold's component text structure to indent.
 * @returns The indented Defold's component text structure.
 */
export function indentLines(data: string): string {
  return do_with_lines(data, indentLine);
}

/**
 * Wraps each line of the Defold's component text structure in quotes.
 * @param data - The Defold's component text structure to wrap in quotes.
 * @returns The Defold's component text structure with each line wrapped in quotes.
 */
export function wrapLinesInQuotes(data: string): string {
  return do_with_lines(data, wrapInQuotes);
}

/**
 * Processes each line of the Defold's component text structure.
 * @param data - The Defold's component text structure to process.
 * @param escapeTimes - The number of times to escape each line.
 * @returns The processed Defold's component text structure.
 */
export function processLines(data: string, escapeTimes = 1): string {
  return do_with_lines(data, processLine, escapeTimes);
}

/**
 * Utility function that applies a transformation to each line of a Defold's component text structure.
 * @param data - The Defold's component text structure to transform.
 * @param callback - The transformation to apply to each line.
 * @param args - Additional arguments to pass to the transformation.
 * @returns The transformed Defold's component text structure.
 */
function do_with_lines<T extends unknown[]>(data: string, callback: (line: string, ...args: T) => string, ...args: T): string {
  const lines = splitByLines(data);
  const transformedLines = transformLines(lines, callback, ...args);
  const result = joinLines(transformedLines);
  return result;
}

/**
 * Transforms each line of an array of lines of Defold's component text structure.
 * @param lines - The array of lines to transform.
 * @param callback - The transformation to apply to each line.
 * @param args - Additional arguments to pass to the transformation.
 * @returns The transformed array of lines.
 */
function transformLines<T extends unknown[]>(lines: string[], callback: (line: string, ...args: T) => string, ...args: T): string[] {
  const transformedLines = lines.map(line => callback(line, ...args));
  return transformedLines;
}

/**
 * Processes a line of a Defold's component text structure.
 * @param line - The line to process.
 * @param escapeLevels - The number of times to escape the line.
 * @returns The processed line.
 */
function processLine(line: string, escapeLevels = 1): string {
  const lineWithEndOfLine = insertEndOfLine(line);
  const escapedLine = escapeLineByLevel(lineWithEndOfLine, escapeLevels);
  return escapedLine;
}

/**
 * Indents a line of a Defold's component text structure.
 * @param line - The line to indent.
 * @returns The indented line.
 */
function indentLine(line: string): string {
  return `${INDENTATION}${line}`;
}

/**
 * Inserts end of line symbol at the end of line of Defold's component text structure.
 * @param data - The line to insert end of line symbol in.
 * @returns The line with end of line symbol.
 */
function insertEndOfLine(data: string): string {
  return `${data}\n`;
}

/**
 * Wraps a line of a Defold's component text structure in quotes.
 * @param data - The line to wrap in quotes.
 * @returns The line wrapped in quotes.
 */
function wrapInQuotes(data: string): string {
  return `"${data}"`;
}

/**
 * Escapes a line of a Defold's component text structure a specified number of times.
 * @param data - The line to escape.
 * @param escapeLevels - The number of times to escape the line.
 * @returns The escaped line.
 */
function escapeLineByLevel(data: string, escapeLevels = 1): string {
  for (let escapeLevel = 0; escapeLevel < escapeLevels; escapeLevel += 1) {
    data = escapeLine(data);
  }
  return data;
}

/**
 * Escapes a line of a Defold's component text structure.
 * @param data - The line to escape.
 * @returns The escaped line.
 */
function escapeLine(data: string): string {
  return JSON.stringify(data).slice(1, -1);
}