import {
  andRegex,
  arrowRegex,
  biArrowRegex,
  extract,
  global,
  groupRegex,
  normalize,
  notGroupRegex,
  notRegex,
  orRegex,
  strictLetterRegex
} from './utils'

function concat(...words: string[]): string {
  return words
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function quote(letter: string): string {
  if (!strictLetterRegex.test(letter)) {
    return letter
  }
  return `"${letter}"`
}

function mapQuote(line: string): string {
  return line.split(' ').map(quote).join(' ')
}

function describeLetter(letter: string): string {
  if (!strictLetterRegex.test(letter)) {
    return letter
  }

  const notSignalsLength = letter.replace(/[^~]/g, '').length
  const absoluteLetter = quote(letter.replace(global(notRegex), ''))
  return notSignalsLength % 2 === 0
    ? concat(absoluteLetter, 'is true')
    : concat(absoluteLetter, 'is false')
}

function describeLetters(line: string): string {
  return line.split(' ').map(describeLetter).join(' ')
}

function describeOperators(line: string): string {
  if (orRegex.test(line) && andRegex.test(line)) {
    line = line.replace(andRegex, 'and').replace(orRegex, ', or')
  }
  if (orRegex.test(line)) {
    line = line.replace(orRegex, 'or')
  }
  if (andRegex.test(line)) {
    line = line.replace(andRegex, 'and')
  }
  if (biArrowRegex.test(line)) {
    line = concat('if and only if', line.replace(biArrowRegex, ', then'))
  }
  if (arrowRegex.test(line)) {
    line = concat('if', line.replace(arrowRegex, ', then'))
  }
  return line
}

function describeNotGroup(line: string): string {
  if (!notGroupRegex.test(line)) {
    return line
  }
  return line.replace(global(notGroupRegex), match =>
    concat(
      'negation of (',
      describeOperators(mapQuote(extract(match, notGroupRegex))),
      ')'
    )
  )
}

function describeGroup(line: string): string {
  if (!groupRegex.test(line)) {
    return line
  }
  return line.replace(global(groupRegex), match =>
    concat('(', describe(extract(match, groupRegex)), ')')
  )
}

export function describe<T extends string | string[]>(lines: T): T {
  if (Array.isArray(lines)) {
    const result = Array.from(lines).map(g => normalize(g))
    for (const line of lines) {
      result.push(describe(line))
    }
    return result as T
  }

  let result = lines as string

  if (notGroupRegex.test(result)) {
    result = describeNotGroup(result)
  }
  if (groupRegex.test(result)) {
    result = describeGroup(result)
  }

  result = describeLetters(result)
  result = describeOperators(result)

  return extract(extract(result, /\s+([,)])/g), /([(])\s+/g) as T
}
