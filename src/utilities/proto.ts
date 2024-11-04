const INDENTATION = "  ";

function do_with_lines<T extends unknown[]>(data: string, callback: (line: string, ...args: T) => string, ...args: T): string {
  const lines = data.trim().split("\n");
  const processedLines = lines.map(line => callback(line, ...args));
  const result = processedLines.join("\n");
  return result;
}

function indentLine(line: string): string {
  return `${INDENTATION}${line}`;
}

function escapeLine(data: string): string {
  return JSON.stringify(data).slice(1, -1);
}

function insertEndOfLines(data: string): string {
  return `${data}\n`;
}

function wrapInQuotes(data: string): string {
  return `"${data}"`;
}

function processDataLine(line: string, escapeTimes = 1): string {
  const lineWithEndOfLines = insertEndOfLines(line);
  let escapedLine = lineWithEndOfLines;
  for (let escapeTime = 0; escapeTime < escapeTimes; escapeTime += 1) {
    escapedLine = escapeLine(escapedLine);
  }
  return escapedLine;
}

export function indentLines(data: string): string {
  return do_with_lines(data, indentLine);
}

export function wrapLinesInQuotes(data: string): string {
  return do_with_lines(data, wrapInQuotes);
}

export function processDataLines(data: string, escapeTimes = 1): string {
  return do_with_lines(data, processDataLine, escapeTimes);
}