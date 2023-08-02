import * as LogicActions from './actions'
import * as LogicErrors from './errors'
import { clear, normalize } from './utils'

export * from './actions'
export * from './errors'

export type LogicAction = keyof typeof LogicActions
export type LogicError = keyof typeof LogicErrors

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
 * //['~p -> ~q v r', 's v (r -> t)', '~p v s', '~s', 'q', '~p', '~q v r', 'r', 'r -> t', 't', 't v u'
 **/
export function resolve<T extends string | string[]>(
  lines: T,
  solvedLines: string[] = [],
  throwOnError: boolean = true
): T {
  if (Array.isArray(lines)) {
    const result = Array.from(solvedLines).map(g => normalize(g))
    for (const unsolvedLine of lines) {
      result.push(resolve(unsolvedLine, result, throwOnError))
    }
    return result as T
  }

  const line = lines as string
  const answerParts = clear(line).split(' ')

  const action = answerParts[0] as LogicAction
  if (!LogicActions[action] && throwOnError) {
    throw new LogicErrors.InvalidActionError()
  }
  if (!LogicActions[action]) {
    return new LogicErrors.InvalidActionError().message as T
  }

  const targetLines = answerParts.map(n => Number(n) - 1).filter(n => !isNaN(n))
  const notFoundLine = targetLines.find(n => n < 0 || n >= solvedLines.length)
  if (notFoundLine && throwOnError) {
    throw new LogicErrors.InvalidLineError(notFoundLine + 1)
  }
  if (notFoundLine) {
    return new LogicErrors.InvalidLineError(notFoundLine + 1).message as T
  }

  try {
    return LogicActions[action](solvedLines.concat([line]), targetLines) as T
  } catch (error) {
    if (throwOnError) {
      throw error
    }
    return error.message
  }
}
