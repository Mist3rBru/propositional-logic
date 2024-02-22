/* eslint-disable @typescript-eslint/padding-line-between-statements */
export const strictLetterRegex = /^~*[a-uw-z]$/
export const strictGroupRegex = /^\((.*?)\)$/
export const strictNotGroupRegex = /^~\(([^)]*)\)$/
export const strictOrRegex = /^[Vv∨]$/

export const arrowRegex = /(?:[=-]>)|(?:−)||→/
export const biArrowRegex = /(?:<[=-]*>)|⇔/
export const orRegex = /[Vv∨]/
export const andRegex = /[\^∧]/
export const notRegex = /~/
export const doubleNotRegex = /~{2}/

export const notGroupRegex = /~\(([^)]*)\)/
export const groupRegex = /\(([^)]*)\)/

export const orSignal = 'v'
export const andSignal = '^'
export const arrowSignal = '->'
export const biArrowSignal = '<->'

/* eslint-enable @typescript-eslint/padding-line-between-statements */

export function clear(line: string): string {
  return line
    .toLowerCase()
    .replaceAll(/\s{2,}/g, ' ')
    .trim()
}

export function normalize(...parts: string[]): string {
  return clear(
    parts
      .join(' ')
      .replaceAll(/([()A-Z^a-z~])/g, ' $1 ')
      .replaceAll(/(?:(\()\s+)|(?:\s+(\)))/g, '$1$2')
      .replaceAll(/~\s+/g, '~')
  )
}

export function not(line: string): string {
  return /^~*[(a-uw-z]/.test(line)
    ? /^~*\w./.test(line)
      ? `~${group(line)}`
      : `~${line}`
    : line
}

export function mapNot(line: string): string {
  const isGroup = line.length > 1 && !/^~+\w$/.test(line)

  return isGroup ? [...line].map(not).join('') : not(line)
}

export function ungroup(line: string): string {
  const f = first(line)
  const l = last(line)

  return strictGroupRegex.test(line) && !/.+\).+/.test(line)
    ? line.replace(strictGroupRegex, '$1')
    : f === '(' && l !== ')'
      ? line.slice(1)
      : f !== '~' && l === ')' && !/.+\(.+/.test(line)
        ? line.slice(0, -1)
        : line
}

export function group(...letters: string[]): string {
  const line = letters.join(' ')

  return /^~*\(.+\)$/.test(line)
    ? /.\)./.test(line)
      ? `(${line})`
      : line
    : /^~*\([^)]+$/.test(line)
      ? `${line})`
      : line.endsWith(")")
        ? `(${line}`
        : `(${line})`
}

export function resolve(line: string): string {
  let result = line

  if (strictNotGroupRegex.test(result)) {
    result = mapNot(result.replace(strictNotGroupRegex, '$1'))
  }

  if (doubleNotRegex.test(result)) {
    result = result.replace(global(doubleNotRegex), '')
  }

  return ungroup(result)
}

export function prune(line: string): string {
  return line.replaceAll(/\s/g, '')
}

export function split(line: string, regex: RegExp): [string, string] {
  const isArrow = regex.source.includes('>')
  let index = -1
  let step = 1

  for (let i = 0; i < line.length; i++) {
    if (regex.test(line[i])) {
      index = i
      break
    }

    if (isArrow && regex.test(line[i] + line[i + 1])) {
      index = i
      step = 2
      break
    }
  }

  return ~index
    ? [line.slice(0, index), line.slice(index + step)]
    : line.split(regex).length === 2
      ? (line.split(regex) as [string, string])
      : [line, '']
}

export function compare(...cases: string[]): boolean {
  return (
    cases
      .map(prune)
      .map(resolve)
      .filter((c, i, ar) => c === ar[0]).length === cases.length
  )
}

export function find(
  regex: RegExp,
  ...target: [string, string]
): [condition: string, data: string] {
  return regex.test(target[0]) ? target : (target.reverse() as [string, string])
}

export function global(regex: RegExp): RegExp {
  if (regex.global) {
    return regex
  }

  return new RegExp(regex, 'g')
}

export function extract(line: string, regex: RegExp): string {
  return line.replace(regex, '$1')
}

export function catchSignal(line: string): [regex: RegExp, signal: string] {
  return biArrowRegex.test(line)
    ? [biArrowRegex, biArrowSignal]
    : arrowRegex.test(line)
      ? [arrowRegex, arrowSignal]
      : orRegex.test(line)
        ? [orRegex, orSignal]
        : [andRegex, andSignal]
}

export function invertSignal(line: string): string {
  let invertedStr = ''

  for (const char of line) {
    if (orRegex.test(char)) {
      invertedStr += andSignal
    } else if (andRegex.test(char)) {
      invertedStr += orSignal
    } else {
      invertedStr += char
    }
  }

  return invertedStr
}

export function first(lines: string | string[]): string {
  return lines[0]
}

export function last(lines: string | string[]): string {
  return lines.at(-1) ?? ''
}

export function targets(lines: string[], targetLines: number[]): string[] {
  return targetLines.map(target => lines[target])
}

export function mapWords(line: string, cb: (word: string) => string): string {
  return line.split(/\s+/g).map(cb).join(' ')
}
