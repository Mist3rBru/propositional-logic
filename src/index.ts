import * as actions from './actions'
import { clear } from './utils'

export * from './actions'

export type Action = keyof typeof actions

export function resolve<T extends string | string[]>(
  lines: T,
  solvedLines: string[] = []
): T {
  if (Array.isArray(lines)) {
    const result = Array.from(solvedLines)
    for (const unsolvedLine of lines) {
      result.push(resolve(unsolvedLine, result))
    }
    return result as T
  }

  const line = lines as string
  const answerParts = clear(line).split(' ')

  const action = answerParts[0] as Action
  const targetLines = answerParts.map(n => Number(n) - 1).filter(n => !isNaN(n))

  const notFoundLine = targetLines.find(n => n < 0 || n >= solvedLines.length)
  if (notFoundLine) {
    return `linha '${notFoundLine + 1}' não encontrada` as T
  }

  return actions[action]
    ? (actions[action](solvedLines.concat([line]), targetLines) as T)
    : (line as T)
}
