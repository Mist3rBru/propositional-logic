import {
  andRegex,
  arrowRegex,
  global,
  normalize,
  notRegex,
  orRegex,
  prune,
  strictLetterRegex
} from './utils'

function concat(...words: string[]): string {
  return words
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function quote(letter: string): string {
  return `"${letter}"`
}

function describeLetter(letter: string): string {
  const notSignalsLength = letter.replace(/[^~]/g, '').length
  const absoluteLetter = quote(letter.replace(global(notRegex), ''))
  return notSignalsLength % 2 === 0
    ? concat(absoluteLetter, 'is true')
    : concat(absoluteLetter, 'is false')
}

export function describe<T extends string | string[]>(lines: T): T {
  if (Array.isArray(lines)) {
    const result = Array.from(lines).map(g => normalize(g))
    for (const line of lines) {
      result.push(describe(line))
    }
    return result as T
  }

  let result = ''
  for (const part of lines.split(' ')) {
    if (strictLetterRegex.test(part)) {
      result = concat(result, describeLetter(part))
      continue
    }

    result = concat(result, part)
  }

  if (orRegex.test(result) && andRegex.test(result)) {
    result = result.replace(andRegex, 'and').replace(orRegex, ', or')
  } else if (orRegex.test(result)) {
    result = result.replace(orRegex, 'or')
  } else if (andRegex.test(result)) {
    result = result.replace(andRegex, 'and')
  }

  if (arrowRegex.test(result)) {
    result = concat('if', result.replace(arrowRegex, ', then'))
  }

  return result.replace(/\s+,/g, ',') as T
}
