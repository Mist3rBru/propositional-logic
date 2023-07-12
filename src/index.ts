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
  rejectOnError: boolean = true
): T {
  if (Array.isArray(lines)) {
    const result = Array.from(solvedLines)
    for (const unsolvedLine of lines) {
      try {
        result.push(resolve(unsolvedLine, result))
      } catch (error) {
        if (rejectOnError) {
          throw error
        }
        result.push(error.message)
      }
    }
    return result as T
  }

  const line = lines as string
  const answerParts = clear(line).split(' ')

  const action = answerParts[0] as LogicAction
  const targetLines = answerParts.map(n => Number(n) - 1).filter(n => !isNaN(n))

  const notFoundLine = targetLines.find(n => n < 0 || n >= solvedLines.length)
  if (notFoundLine) {
    throw new LogicErrors.InvalidLineError(notFoundLine + 1)
  }

  return LogicActions[action]
    ? (LogicActions[action](solvedLines.concat([line]), targetLines) as T)
    : (line as T)
}
