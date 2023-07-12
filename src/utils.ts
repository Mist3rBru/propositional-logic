import { MissingTargetLineError } from './errors'

export const arrowRegex = /(?:[-=]>)||→/
export const biArrowRegex = /(?:<[-=]{0,}>)|⇔/
export const orRegex = /∨|v|V/
export const andRegex = /\^|∧/
export const groupRegex = /^\((.*?)\)$/
export const notGroupRegex = /^~\((.*?)\)$/
export const notRegex = /~/
export const doubleNotRegex = /~{2}/

export const orSignal = 'v'
export const andSignal = '^'
export const arrowSignal = '->'
export const biArrowSignal = '<->'

export const invalidActionMessage = 'Ação Inválida'

export function clear(line: string): string {
  return line
    .toLowerCase()
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function normalize(...parts: string[]): string {
  return clear(
    parts
      .join(' ')
      .replace(/([a-zA-Z\^v()~])/g, ' $1 ')
      .replace(/(?:(\()\s+)|(?:\s+(\)))/g, '$1$2')
      .replace(/~\s+/g, '~')
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
  const isGroup = line.length > 1 && !/^~{1,}\w$/.test(line)
  return isGroup ? line.split('').map(not).join('') : not(line)
}

export function ungroup(line: string): string {
  return groupRegex.test(line)
    ? line.replace(groupRegex, '$1')
    : /(?:^\()|(?:^[^~].*\))$/.test(line)
    ? line.replace(/^\(/, '').replace(/\)$/, '')
    : line
}

export function group(...letters: string[]): string {
  const line = letters.join(' ')
  return /^~*\(/.test(line)
    ? /\)$/.test(line)
      ? line
      : /^~*\(.*?\).+/.test(line)
      ? `(${line})`
      : `${line})`
    : /\)$/.test(line)
    ? `(${line}`
    : `(${line})`
}

export function resolve(line: string): string {
  if (notGroupRegex.test(line)) {
    const content = line.replace(notGroupRegex, '$1')
    line = mapNot(content)
  }
  if (doubleNotRegex.test(line)) {
    line = line.replace(globalRegex(doubleNotRegex), '')
  }
  return ungroup(line)
}

export function prune(line: string): string {
  return line.replace(/\s/g, '')
}

export function split(line: string, regex: RegExp): [string, string] {
  const isArrow = />/.test(regex.source)
  let index = -1
  let step = 1
  for (let i = 0; i < line.split('').length; i++) {
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
  return !!~index
    ? [line.slice(0, index), line.slice(index + step)]
    : line.split(regex).length === 2
    ? (line.split(regex) as [string, string])
    : [line, '']
}

export function compare(...cases: string[]): boolean {
  return (
    cases
      .map(resolve)
      .map(prune)
      .filter((c, i, ar) => c === ar[0]).length === cases.length
  )
}

export function find(
  regex: RegExp,
  ...target: [string, string]
): [condition: string, data: string] {
  return regex.test(target[0]) ? target : (target.reverse() as [string, string])
}

export function globalRegex(regex: RegExp): RegExp {
  if (regex.global) {
    return regex
  }
  return new RegExp(regex, 'g')
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
  const [regex, signal] = orRegex.test(line)
    ? [orRegex, andSignal]
    : [andRegex, orSignal]
  return line.replace(globalRegex(regex), signal)
}

export function getPrompt(lines: string[]): string {
  return lines[lines.length - 1]
}

export function verifyTargetLines(
  targetLines: number[],
  minTargetLines: number
): void {
  if (targetLines.length < minTargetLines) {
    throw new MissingTargetLineError(targetLines.length, minTargetLines)
  }
}
