import * as LogicErrors from './errors'

export type Lang = 'en' | 'pt'

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

export const pt: {
  keywords: Record<Keyword, string>
  exceptions: Record<
    keyof typeof LogicErrors,
    {
      regex: RegExp
      translation: string
    }
  >
} = {
  keywords: {
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
  },
  exceptions: {
    InvalidActionError: {
      regex: new RegExp(new LogicErrors.InvalidActionError().message),
      translation: 'ação inválida'
    },
    InvalidLineError: {
      regex: /line ('\d+') does not exist/,
      translation: 'linha $1 não encontrada'
    },
    MissingTargetLineError: {
      regex: /min target lines: (\d+), received: (\d+)/,
      translation: 'linhas alvo mínimas: $1, encontradas: $2'
    }
  }
}

/**
 * Translates package results to `lang`
 * @example
 * translate('"a" is true', 'pt')
 * //'"a" é verdadeiro'
 * translate(['"a" is true', '"b" is false'], 'pt')
 * //['"a" é verdadeiro', '"b" é falso']
 */
export function translate<T extends string | string[] | Error>(
  lines: T,
  lang: Lang
): T {
  if (Array.isArray(lines)) {
    return lines.map(line => translate(line, lang)) as T
  }

  const isError = typeof lines === 'object'
  const line = typeof lines === 'string' ? lines : lines.message
  let result = ''

  switch (lang) {
    case 'en':
      result = line
      break
    case 'pt':
      result = line
        .replace(/(\w+)/g, match => {
          return pt.keywords[match as Keyword] ?? match
        })
        .replace(/(são\s\w+)/g, '$1s')
      if (result === line) {
        for (const { regex, translation } of Object.values(pt.exceptions)) {
          if (regex.test(line)) {
            result = line.replace(regex, translation)
            break
          }
        }
      }
      break
    default:
      throw new LogicErrors.InvalidActionError()
  }

  if (isError) {
    lines.message = result
    return lines
  }

  return result as T
}
