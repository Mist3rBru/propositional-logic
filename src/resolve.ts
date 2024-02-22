import * as LogicActions from './actions'
import { InvalidActionError, InvalidLineError } from './errors'
import { type Lang, translate } from './translate'
import { clear, normalize } from './utils'

export type LogicAction = keyof typeof LogicActions

interface ResolveOptions {
  /**
   * @default true
   */
  throwOnError?: boolean
  /**
   * The language of the exception messages
   * @default 'en'
   */
  lang?: Lang
}

/**
 * @example
 * resolve(
 *  'mp 1 2',
 *  ['p -> q', 'p']
 * )
 * //'q'
 * resolve(
 *  ['sd 3 4', 'mp 1 6', 'sd 5 7', 'sd 2 4', 'mp 8 9', 'ad u 10'],
 *  ['~p -> ~q v r', 's v (r -> t)', '~p v s', '~s', 'q']
 * )
 * //['~p -> ~q v r', 's v (r -> t)', '~p v s', '~s', 'q', '~p', '~q v r', 'r', 'r -> t', 't', 't v u']
 **/
export function resolve<T extends string | string[]>(
  lines: T,
  solvedLines: string[] = [],
  options?: ResolveOptions
): T {
  const _options: Required<ResolveOptions> = {
    throwOnError: true,
    lang: 'en',
    ...options,
  }

  if (Array.isArray(lines)) {
    const result = solvedLines.map(g => normalize(g))

    for (const unsolvedLine of lines) {
      result.push(resolve(unsolvedLine, result, _options))
    }

    return result as T
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  const line = lines as string
  const answerParts = clear(line).split(' ')

  const action = answerParts[0] as LogicAction
  const isValidAction = action in LogicActions

  if (!isValidAction && _options.throwOnError) {
    throw translate(new InvalidActionError(), _options.lang)
  }

  if (!isValidAction) {
    return translate(new InvalidActionError().message, _options.lang) as T
  }

  const targetLines = answerParts
    .map(n => Number(n) - 1)
    .filter(n => !Number.isNaN(n))
  const notFoundLine = targetLines.find(n => n < 0 || n >= solvedLines.length)

  if (notFoundLine && _options.throwOnError) {
    throw translate(new InvalidLineError(notFoundLine + 1), _options.lang)
  }

  if (notFoundLine) {
    return translate(
      new InvalidLineError(notFoundLine + 1).message,
      _options.lang
    ) as T
  }

  try {
    return LogicActions[action]([...solvedLines, line], targetLines) as T
  } catch (error) {
    if (_options.throwOnError) {
      throw translate(error, _options.lang)
    }

    return translate((error as Error).message, _options.lang) as T
  }
}
