import { Lang, translate } from './translate'
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
    line = line
      .replace(andRegex, 'and')
      .replace(
        /(["\w]+)\sis\strue\sand\s(["\w]+)\sis\strue/,
        '$1 and $2 are true'
      )
      .replace(
        /(["\w]+)\sis\sfalse\sand\s(["\w]+)\sis\sfalse/,
        '$1 and $2 are false'
      )
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
  return line.replace(global(notGroupRegex), match =>
    concat(
      'negation of (',
      describeOperators(mapQuote(extract(match, notGroupRegex))),
      ')'
    )
  )
}

function describeGroup(line: string, lang: Lang): string {
  return line.replace(global(groupRegex), match =>
    concat('(', describe(extract(match, groupRegex), lang), ')')
  )
}

/**
 * @example
 * describe('a -> b')
 * //'if "a" is true, then "b" is true'
 * describe(['a -> b', 'a', 'b'])
 * //'if "a" is true, then "b" is true; "a" is true; therefore "b" is true'
 */
export function describe(lines: string | string[], lang: Lang = 'en'): string {
  if (Array.isArray(lines)) {
    const normalizedLines = lines.map(g => normalize(g))
    let result = ''
    for (let i = 0; i < normalizedLines.length; i++) {
      const description = describe(lines[i], lang)
      result +=
        i === 0
          ? description
          : i === lines.length - 1
          ? concat(';', translate('therefore', lang), description)
          : concat(';', description)
    }
    return result
  }

  let result = lines as string

  if (notGroupRegex.test(result)) {
    result = describeNotGroup(result)
  }
  if (groupRegex.test(result)) {
    result = describeGroup(result, lang)
  }

  result = describeLetters(result)
  result = describeOperators(result)
  result = extract(extract(result, /\s+([,)])/g), /([(])\s+/g)

  return translate(result, lang)
}
