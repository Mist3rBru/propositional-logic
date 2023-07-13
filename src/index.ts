import * as LogicActions from './actions'
import * as LogicErrors from './errors'
import { clear } from './utils'

export * from './actions'
export * from './errors'

export type LogicAction = keyof typeof LogicActions
export type LogicError = keyof typeof LogicErrors

export function resolve<T extends string | string[]>(
  lines: T,
  solvedLines: string[] = [],
  throwOnError: boolean = true
): T {
  if (Array.isArray(lines)) {
    const result = Array.from(solvedLines)
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

  return LogicActions[action](solvedLines.concat([line]), targetLines) as T
}
