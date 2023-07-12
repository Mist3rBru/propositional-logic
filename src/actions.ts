// http://www.celiomoliterno.eng.br/Arquivos/fatec/TabInferEquiv.pdf
import {
  andRegex,
  andSignal,
  arrowRegex,
  arrowSignal,
  biArrowRegex,
  catchSignal,
  clear,
  compare,
  doubleNotRegex,
  find,
  getPrompt,
  globalRegex,
  group,
  groupRegex,
  invalidActionMessage,
  invertSignal,
  mapNot,
  normalize,
  not,
  notGroupRegex,
  orRegex,
  orSignal,
  prune,
  resolve,
  split,
  ungroup
} from './utils'

export function dn(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
  if (target.length !== 3) {
    return invalidActionMessage
  }
  const result = target.replace(doubleNotRegex, '')
  return normalize(result)
}

export function ip(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
  const signalRegex = orRegex.test(target) ? orRegex : andRegex
  const [caseA, caseB] = split(target, signalRegex)
  return compare(caseA, caseB) ? normalize(caseA) : invalidActionMessage
}

export function com(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = prune(lines[targetLines[0]])
  if (target.length < 3) {
    return invalidActionMessage
  }
  const [signalRegex, signal] = catchSignal(target)
  const result = split(target, signalRegex).reverse().join(signal)
  return normalize(result)
}

export function ass(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = prune(lines[targetLines[0]])
  if (target.length <= 3) {
    return invalidActionMessage
  }

  const groupIndex = target.indexOf('(')
  const [signalRegex, signal] = catchSignal(target)
  const parts = target.split(signalRegex).map(ungroup)
  if (parts.length !== 3) {
    return invalidActionMessage
  }

  return groupIndex === 0
    ? normalize(parts[0], signal, group(parts[1], signal, parts[2]))
    : normalize(group(parts[0], signal, parts[1]), signal, parts[2])
}

export function dm(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = invertSignal(lines[targetLines[0]])
  if (target.length <= 3) {
    return invalidActionMessage
  }

  const isNotGroup = notGroupRegex.test(target)
  return isNotGroup
    ? normalize(resolve(target))
    : normalize(mapNot(group(target)).replace(/~{2}/g, ''))
}

export function dis(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  let target = prune(lines[targetLines[0]])
  if (target.length <= 3) {
    return invalidActionMessage
  }

  const startGroupIndex = target.indexOf('(')
  if (startGroupIndex !== 0) {
    target = [
      target.slice(0, startGroupIndex - 1),
      target.charAt(startGroupIndex - 1),
      target.slice(startGroupIndex)
    ]
      .reverse()
      .join('')
  }

  const outerSignal = target.replace(/.+?\)(.).+/, '$1')
  const innerLetters = target
    .replace(groupRegex, '$1')
    .replace(/[()]/g, '')
    .replace(orRegex, ' ')
    .replace(andRegex, ' ')
    .split(' ')

  const innerSignal = target.replace(/\(~{0,}\w(.).+/, '$1')
  const outerLetter = target.charAt(target.length - 1)

  return normalize(
    group(outerLetter, outerSignal, innerLetters[0]),
    innerSignal,
    group(outerLetter, outerSignal, innerLetters[1])
  )
}

export function cp(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
  if (target.length <= 3) {
    return invalidActionMessage
  }
  const [signalRegex, signal] = catchSignal(target)
  const result = split(target, signalRegex)
    .map(clear)
    .map(part => {
      return groupRegex.test(part) || notGroupRegex.test(part)
        ? not(part)
        : mapNot(part)
    })
    .join(signal)
  return normalize(result)
}

export function cond(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = prune(lines[targetLines[0]])
  if (arrowRegex.test(target)) {
    return normalize(
      split(target, arrowRegex).reverse().map(not).join(arrowSignal)
    )
  }
  if (orRegex.test(target)) {
    const orLetters = split(target, orRegex)
    return normalize(resolve(not(orLetters[0])), arrowSignal, orLetters[1])
  }
  return invalidActionMessage
}

export function bi(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = prune(lines[targetLines[0]])
  if (!biArrowRegex.test(target)) {
    return invalidActionMessage
  }
  const letters = split(target, biArrowRegex)
  return normalize(
    group(letters[0], arrowSignal, letters[1]),
    andSignal,
    group(letters[1], arrowSignal, letters[0])
  )
}

export function ad(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = prune(lines[targetLines[0]])
  if (!/^~{0,}\w$/.test(target)) {
    return invalidActionMessage
  }
  const newLetter = getPrompt(lines).replace(/^.{3}([^\s]+).+/, '$1')
  return normalize(target, orSignal, newLetter)
}

export function sim(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]

  if (arrowRegex.test(target) && andRegex.test(target)) {
    const [andCondition, result] = split(target, arrowRegex).map(clear)
    const andLetters = split(andCondition, andRegex).map(clear)
    if (andLetters.length < 2) {
      return invalidActionMessage
    }
    return normalize(
      andCondition,
      arrowSignal,
      andLetters.find(l => l !== result)!
    )
  }

  if (andRegex.test(target)) {
    const desiredLetter = getPrompt(lines).replace(/^.{4}([^\s]+).+/, '$1')
    if (!desiredLetter) {
      return 'nenhuma proposição selecionada'
    }
    const andLetters = target.split(andRegex).map(prune)
    if (andLetters.length < 2) {
      return invalidActionMessage
    }
    return andLetters.includes(desiredLetter)
      ? normalize(desiredLetter)
      : invalidActionMessage
  }

  return invalidActionMessage
}

export function mp(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    return ''
  }
  const [condition, data] = find(
    arrowRegex,
    lines[targetLines[0]],
    lines[targetLines[1]]
  )
  const [requirement, ...result] = condition.split(arrowRegex).map(clear)

  return compare(data, requirement)
    ? normalize(ungroup(result.join(arrowSignal)))
    : invalidActionMessage
}

export function mt(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    return ''
  }
  const [condition, data] = find(
    arrowRegex,
    lines[targetLines[0]],
    lines[targetLines[1]]
  ).map(resolve)
  const [requirement, result] = split(condition, arrowRegex).map(clear)

  return compare(data, resolve(mapNot(requirement)))
    ? normalize(not(result))
    : compare(data, resolve(mapNot(result)))
    ? normalize(not(requirement))
    : invalidActionMessage
}

export function sd(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    return ''
  }
  const [condition, data] = find(
    orRegex,
    lines[targetLines[0]],
    lines[targetLines[1]]
  )
  const [caseA, caseB] = split(condition, orRegex).map(clear).map(ungroup)

  return compare(data, mapNot(caseA))
    ? normalize(caseB)
    : compare(data, mapNot(caseB))
    ? normalize(caseA)
    : invalidActionMessage
}

export function sh(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    return ''
  }

  const target1 = lines[targetLines[0]]
  const target2 = lines[targetLines[1]]
  if (!arrowRegex.test(target1) || !arrowRegex.test(target2)) {
    return invalidActionMessage
  }

  const parts = split(target1, arrowRegex)
    .concat(split(target2, arrowRegex))
    .map(clear)

  return compare(parts[1], parts[2])
    ? normalize(parts[0], arrowSignal, parts[3])
    : compare(parts[0], parts[3])
    ? normalize(parts[2], arrowSignal, parts[1])
    : invalidActionMessage
}

export function dc(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
    .split(globalRegex(andRegex))
    .map(clear)
    .map(ungroup)
  if (target.length !== 3) {
    return invalidActionMessage
  }
  const orIndex = target.findIndex(t => orRegex.test(t))
  const conditionalStates = target.filter((_, i) => i !== orIndex)
  const orLetters = split(target[orIndex], orRegex)
  const results = conditionalStates
    .map(c => split(c, arrowRegex))
    .flat()
    .map(clear)

  return compare(results[0], orLetters[0]) && compare(results[2], orLetters[1])
    ? normalize(results[1], orSignal, results[3])
    : compare(results[0], orLetters[1]) && compare(results[2], orLetters[0])
    ? normalize(results[1], orSignal, results[3])
    : invalidActionMessage
}

export function dd(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
    .split(globalRegex(andRegex))
    .map(clear)
    .map(ungroup)
  if (target.length !== 3) {
    return invalidActionMessage
  }
  const orIndex = target.findIndex(t => orRegex.test(t))
  const conditionalStates = target.filter((_, i) => i !== orIndex)
  const orLetters = split(target[orIndex], orRegex)
  const results = conditionalStates
    .map(c => split(c, arrowRegex))
    .flat()
    .map(clear)
    .map(not)

  return compare(results[1], orLetters[0]) && compare(results[3], orLetters[1])
    ? normalize(results[0], orSignal, results[2])
    : compare(results[1], orLetters[1]) && compare(results[3], orLetters[0])
    ? normalize(results[0], orSignal, results[2])
    : invalidActionMessage
}

export function abs(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    return ''
  }
  const target = lines[targetLines[0]]
  if (!arrowRegex.test(target)) {
    return invalidActionMessage
  }
  const [requirement, result] = split(target, arrowRegex)
  return normalize(
    requirement,
    arrowSignal,
    group(requirement, andSignal, result)
  )
}

export function conj(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    return ''
  }
  const target = [lines[targetLines[0]], lines[targetLines[1]]]
  const letterRegex = /^~{0,}\w$/
  if (!letterRegex.test(target[0]) || !letterRegex.test(target[1])) {
    return invalidActionMessage
  }
  return normalize(target[0], andSignal, target[1])
}
