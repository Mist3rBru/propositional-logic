//http://www.celiomoliterno.eng.br/Arquivos/fatec/TabInferEquiv.pdf
import { MissingTargetLineError } from './errors'
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

/**
 * Double negation elimination:
 * @example
 * dn(['~~p'],[0])//'p'
 * //negation of not p is equivalent to p
 * dn(['p'],[0])//'~~p'
 * //p is equivalent to the negation of not p
 */
export function dn(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]
  if (target.length !== 3) {
    return invalidActionMessage
  }
  const result = target.replace(doubleNotRegex, '')
  return normalize(result)
}

/**
 * Tautology
 * @example
 * ip(['p v p'],[0])//'p'
 * //p is true is equiv. to p is true or p is true
 * ip(['p ^ p'],[0])//'p'
 * //p is true is equiv. to p is true and p is true
 */
export function ip(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]
  const signalRegex = orRegex.test(target) ? orRegex : andRegex
  const [caseA, caseB] = split(target, signalRegex)
  return compare(caseA, caseB) ? normalize(caseA) : invalidActionMessage
}

/**
 * Commutation
 * @example
 * ip(['p ^ q'],[0])//'q ^ p'
 * //(p and q) is equiv. to (q and p)
 * ip(['p v q'],[0])//'q v p'
 * //(p or q) is equiv. to (q or p)
 */
export function com(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])
  if (target.length < 3) {
    return invalidActionMessage
  }
  const [signalRegex, signal] = catchSignal(target)
  const result = split(target, signalRegex).reverse().join(signal)
  return normalize(result)
}

/**
 * Association
 * @example
 * ass(['p v (q v r)'],[0])//'(p v q) v r'
 * //p or (q or r) is equiv. to (p or q) or r
 * ass(['p ^ (q ^ r)'],[0])//'(p ^ q) ^ r'
 * //p and (q and r) is equiv. to (p and q) and r
 */
export function ass(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * De Morgan's Theorem
 * @example
 * dm(['~(p ^ q)'],[0])//'~p v ~q'
 * //The negation of (p and q) is equiv. to (not p or not q)
 * dm(['~(p v q)'],[0])//'~p ^ ~q'
 * //The negation of (p or q) is equiv. to (not p and not q)
 */
export function dm(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Distribution
 * @example
 * dis(['p ^ (q v r)'],[0])//'(p ^ q) v (p ^ r)'
 * //p and (q or r) is equiv. to (p and q) or (p and r)
 * dis(['p v (q ^ r)'],[0])//'(p v q) ^ (p v r)'
 * //p or (q and r) is equiv. to (p or q) and (p or r)
 */
export function dis(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * @example
 * cp(['p -> q'],[0])//'~p -> ~q'
 * //If p then q is equiv. to if not p then not q
 */
export function cp(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Transposition
 * @example
 * cond(['p -> q'],[0])//'~q -> ~p'
 * //If p then q is equiv. to if not q then not p
 */
export function cond(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Material Equivalence
 * @example
 * bi(['p <-> q'],[0])//'(p -> q) ^ (q -> p)'
 * //(p iff q) is equiv. to (if p is true then q is true) and (if q is true then p is true)
 */
export function bi(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Addition
 * @example
 * ad(['p', 'q'],[0])//'p v q'
 * //p is true; therefore the disjunction (p or q) is true
 */
export function ad(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Modus Ponens
 * @example
 * mp(['p -> q', 'p'],[0, 1])//'q'
 * //If p then q; p; therefore q
 */
export function mp(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    throw new MissingTargetLineError(targetLines.length, 2)
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

/**
 * Modus Tollens
 * @example
 * mt(['p -> q', '~q'],[0, 1])//'~p'
 * //If p then q; not q; therefore not p
 */
export function mt(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    throw new MissingTargetLineError(targetLines.length, 2)
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

/**
 * Disjunctive Syllogism
 * @example
 * sd(['p v q', '~p'],[0, 1])//'q'
 * //Either p or q, or both; not p; therefore, q
 */
export function sd(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    throw new MissingTargetLineError(targetLines.length, 2)
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

/**
 * Hypothetical Syllogism
 * @example
 * sh(['p -> q', 'q -> r'],[0, 1])//'p -> r'
 * //If p then q; if q then r; therefore, if p then r
 */
export function sh(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    throw new MissingTargetLineError(targetLines.length, 2)
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

/**
 * Constructive Dilemma
 * @example
 * dc(['(p -> q) ^ (r -> s) ^ (p v r)'],[0])//'q v s'
 * //If p then q; and if r then s; but p or r; therefore q or s
 */
export function dc(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Destructive Dilemma
 * @example
 * dd(['(p -> q) ^ (r -> s) ^ (~q v ~s)'],[0])//'~p v ~r'
 * //If p then q; and if r then s; but not q or not s; therefore not p or not r
 */
export function dd(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Absorption
 * @example
 * abs(['p -> q'],[0])//'p -> (p ^ q)'
 * //If p then q; therefore p then p and q
 */
export function abs(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 1) {
    throw new MissingTargetLineError(targetLines.length, 1)
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

/**
 * Conjunction
 * @example
 * conj(['p', 'q'],[0, 1])//'p ^ q'
 * //If p is true, and q is true; therefore p and q are true
 */
export function conj(lines: string[], targetLines: number[]): string {
  if (targetLines.length < 2) {
    throw new MissingTargetLineError(targetLines.length, 2)
  }

  const target = [lines[targetLines[0]], lines[targetLines[1]]]
  const letterRegex = /^~{0,}\w$/
  if (!letterRegex.test(target[0]) || !letterRegex.test(target[1])) {
    return invalidActionMessage
  }
  return normalize(target[0], andSignal, target[1])
}
