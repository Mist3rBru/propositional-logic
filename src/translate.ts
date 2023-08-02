import { InvalidActionError } from './errors'

type Keyword =
  | 'and'
  | 'or'
  | 'true'
  | 'false'
  | 'if'
  | 'then'
  | 'therefore'
  | 'only'
  | 'is'
  | 'are'
  | 'of'
  | 'negation'

const pt: Record<Keyword, string> = {
  and: 'e',
  or: 'ou',
  true: 'verdadeiro',
  false: 'falso',
  if: 'se',
  then: 'então',
  therefore: 'portanto',
  only: 'somente',
  is: 'é',
  are: 'são',
  of: 'de',
  negation: 'negação'
}

/**
 * Translates package results to `lang`
 * @example
 * translate('"a" is true', 'pt')
 * //'"a" é verdadeiro'
 * translate(['"a" is true', '"b" is false'], 'pt')
 * //['"a" é verdadeiro', '"b" é falso']
 */
export function translate<T extends string | string[]>(
  lines: T,
  lang: 'en' | 'pt'
): T {
  if (Array.isArray(lines)) {
    return lines.map(line => translate(line, lang)) as T
  }

  const line = lines as string
  let result = ''
  switch (lang) {
    case 'en':
      result = line
      break
    case 'pt':
      result = line
        .replace(/(\w+)/g, match => {
          return pt[match as Keyword] ?? match
        })
        .replace(/(são\s\w+)/g, '$1s')
      break
    default:
      throw new InvalidActionError()
  }

  return result as T
}
