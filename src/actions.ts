// http://www.celiomoliterno.eng.br/Arquivos/fatec/TabInferEquiv.pdf
import { InvalidActionError, MissingTargetLineError } from './errors'
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
  last,
  global,
  group,
  strictGroupRegex,
  invertSignal,
  mapNot,
  normalize,
  not,
  strictNotGroupRegex,
  orRegex,
  orSignal,
  prune,
  resolve,
  split,
  ungroup,
  first,
  targets,
  strictLetterRegex,
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = clear(lines[targetLines[0]])
  const isDoubleNot = /^~{2}\w$/.test(target)
  const isTruthy = /^\w$/.test(target)

  if (isDoubleNot) {
    return target.replace(doubleNotRegex, '')
  }

  if (isTruthy) {
    return `~~${target}`
  }

  throw new InvalidActionError()
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]
  const signalRegex = orRegex.test(target) ? orRegex : andRegex
  const [caseA, caseB] = split(target, signalRegex)

  if (!compare(caseA, caseB)) {
    throw new InvalidActionError()
  }

  return normalize(caseA)
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (target.length < 3) {
    throw new InvalidActionError()
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (target.length <= 3) {
    throw new InvalidActionError()
  }

  const groupIndex = target.indexOf('(')
  const [signalRegex, signal] = catchSignal(target)
  const parts = target.split(signalRegex).map(ungroup)

  if (parts.length !== 3) {
    throw new InvalidActionError()
  }

  return groupIndex === 0
    ? normalize(parts[0], signal, group(parts[1], signal, parts[2]))
    : normalize(group(parts[0], signal, parts[1]), signal, parts[2])
}

const dmMap = (groups: string[]): string[] => {
  return groups.map(g => {
    return strictNotGroupRegex.test(g)
      ? resolve(g)
      : mapNot(group(g)).replace(global(doubleNotRegex), '')
  })
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const [target] = targets(lines, targetLines).map(invertSignal).map(prune)

  if (strictLetterRegex.test(target)) {
    throw new InvalidActionError()
  }

  const offGroupSignalRegex = /^[^)]+\)([^(~]+)~*\(.+/
  const offGroupSignal = target.replace(offGroupSignalRegex, '$1')
  const isMultiGroup = offGroupSignalRegex.test(target)

  const result = isMultiGroup
    ? dmMap(target.split(offGroupSignal))
        .map(g => group(g))
        .join(offGroupSignal)
    : dmMap([target]).join('')

  return normalize(result)
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  let target = prune(lines[targetLines[0]])

  if (target.length <= 3) {
    throw new InvalidActionError()
  }

  const startGroupIndex = target.indexOf('(')

  if (startGroupIndex !== 0) {
    target = [
      target.slice(0, startGroupIndex - 1),
      target.charAt(startGroupIndex - 1),
      target.slice(startGroupIndex),
    ]
      .reverse()
      .join('')
  }

  const innerSignal = target.replace(/^\(~*\w(.).+/, '$1')
  const outerSignal = target.replace(/^.+?\)(.).+/, '$1')

  const outerLetter = target.replace(/.+?(~*\w)$/, '$1')
  const innerLetters = target
    .replace(strictGroupRegex, '$1')
    .replace(global(orRegex), ' ')
    .replace(global(andRegex), ' ')
    .replace(outerLetter, '')
    .split(' ')
    .filter(Boolean)
    .map(ungroup)

  return normalize(
    innerLetters.map(l => group(outerLetter, outerSignal, l)).join(innerSignal)
  )
}

/**
 * Implication
 * @example
 * cp(['p -> q'],[0])//'~p -> ~q'
 * //If p then q is equiv. to if not p then not q
 */
export function cp(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]

  if (target.length <= 3) {
    throw new InvalidActionError()
  }

  const [signalRegex, signal] = catchSignal(target)
  const result = split(resolve(target), signalRegex)
    .map(clear)
    .map(part => {
      return strictGroupRegex.test(part) ||
        strictNotGroupRegex.test(part) ||
        strictLetterRegex.test(part)
        ? not(part)
        : not(group(part))
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
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (arrowRegex.test(target)) {
    return normalize(
      target.split(global(arrowRegex)).reverse().map(not).join(arrowSignal)
    )
  }

  if (orRegex.test(target)) {
    const orLetters = split(target, orRegex)

    return normalize(
      resolve(not(orLetters[0])),
      arrowSignal,
      strictLetterRegex.test(orLetters[1]) ? orLetters[1] : group(orLetters[1])
    )
  }

  throw new InvalidActionError()
}

/**
 * Material Equivalence
 * @example
 * bi(['p <-> q'],[0])//'(p -> q) ^ (q -> p)'
 * //(p iff q) is equiv. to (if p is true then q is true) and (if q is true then p is true)
 */
export function bi(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (!biArrowRegex.test(target)) {
    throw new InvalidActionError()
  }

  const parts = target.split(global(biArrowRegex))

  return normalize(
    group(parts.join(arrowSignal)),
    andSignal,
    group(parts.reverse().join(arrowSignal))
  )
}

/**
 * Inversion
 * @example
 * inv(['p v q'],[0, 1])//'q v p'
 * //If p or q; therefore q or p
 */
export function inv(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 2)
  }

  const [target] = targets(lines, targetLines)
  const [signalRegex, signal] = catchSignal(target)
  const result = resolve(target)
    .split(global(signalRegex))
    .reverse()
    .join(signal)

  return normalize(result)
}

/**
 * Addition
 * @example
 * ad(['p', 'q'],[0])//'p v q'
 * //p is true; therefore the disjunction (p or q) is true
 */
export function ad(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (!strictLetterRegex.test(target)) {
    throw new InvalidActionError()
  }

  const newLetter = last(lines).replace(/^.{3}(\S+).+/, '$1')

  return normalize(target, orSignal, newLetter)
}

export function sim(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = prune(lines[targetLines[0]])

  if (arrowRegex.test(target) && andRegex.test(target)) {
    const [andCondition, result] = split(target, arrowRegex).map(clear)
    const andLetters = split(andCondition, andRegex).map(clear)

    return normalize(
      andCondition,
      arrowSignal,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      andLetters.find(l => l !== result)!
    )
  }

  if (andRegex.test(target)) {
    const desiredLetter = last(lines).replace(/^.{4}(\S+).+/, '$1')

    if (!desiredLetter) {
      throw new InvalidActionError()
    }

    const andLetters = split(resolve(target), andRegex).map(resolve).map(prune)

    if (!andLetters.includes(desiredLetter)) {
      throw new InvalidActionError()
    }

    return normalize(desiredLetter)
  }

  throw new InvalidActionError()
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

  if (!compare(resolve(data), resolve(requirement))) {
    throw new InvalidActionError()
  }

  return normalize(ungroup(result.join(arrowSignal)))
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

  if (compare(data, resolve(mapNot(requirement)))) {
    return normalize(not(result))
  }

  if (compare(data, resolve(mapNot(result)))) {
    return normalize(not(requirement))
  }

  throw new InvalidActionError()
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

  if (compare(data, mapNot(caseA))) {
    return normalize(caseB)
  }

  if (compare(data, mapNot(caseB))) {
    return normalize(caseA)
  }

  throw new InvalidActionError()
}

/**
 * Hypothetical Syllogism
 * @example
 * sh(['p -> q', 'q -> r'],[0, 1])//'p -> r'
 * //If p then q; if q then r; therefore, if p then r
 */
export function sh(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 2)
  }

  if (targetLines.length === 1 && arrowRegex.test(lines[targetLines[0]])) {
    const target = lines[targetLines[0]]
      .split(global(arrowRegex))
      .map(clear)
      .map(ungroup)

    return normalize(first(target), arrowSignal, last(target))
  }

  if (
    targetLines.length === 2 &&
    arrowRegex.test(lines[targetLines[0]]) &&
    arrowRegex.test(lines[targetLines[1]])
  ) {
    const [target1, target2] = targets(lines, targetLines).map(target =>
      target.split(global(arrowRegex)).map(clear).map(ungroup)
    )

    if (compare(last(target1), first(target2))) {
      return normalize(first(target1), arrowSignal, last(target2))
    }

    if (compare(first(target1), last(target2))) {
      return normalize(first(target2), arrowSignal, last(target1))
    }
  }

  throw new InvalidActionError()
}

/**
 * Constructive Dilemma
 * @example
 * dc(['(p -> q) ^ (r -> s) ^ (p v r)'],[0])//'q v s'
 * //If p then q; and if r then s; but p or r; therefore q or s
 */
export function dc(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const groups = lines[targetLines[0]]
    .split(global(andRegex))
    .map(clear)
    .map(ungroup)

  if (groups.length !== 3) {
    throw new InvalidActionError()
  }

  const orGroupIndex = groups.findIndex(g => orRegex.test(g))
  const conditionalGroups = groups.filter((_, i) => i !== orGroupIndex)
  const orLetters = split(groups[orGroupIndex], orRegex)
  const conditionalLetters = conditionalGroups
    .flatMap(c => split(c, arrowRegex))
    .map(clear)

  if (
    compare(conditionalLetters[0], orLetters[0]) &&
    compare(conditionalLetters[2], orLetters[1])
  ) {
    return normalize(conditionalLetters[1], orSignal, conditionalLetters[3])
  }

  if (
    compare(conditionalLetters[0], orLetters[1]) &&
    compare(conditionalLetters[2], orLetters[0])
  ) {
    return normalize(conditionalLetters[1], orSignal, conditionalLetters[3])
  }

  throw new InvalidActionError()
}

/**
 * Destructive Dilemma
 * @example
 * dd(['(p -> q) ^ (r -> s) ^ (~q v ~s)'],[0])//'~p v ~r'
 * //If p then q; and if r then s; but not q or not s; therefore not p or not r
 */
export function dd(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]
    .split(global(andRegex))
    .map(clear)
    .map(ungroup)

  if (target.length !== 3) {
    throw new InvalidActionError()
  }
  const orGroupIndex = target.findIndex(t => orRegex.test(t))
  const conditionalGroups = target.filter((_, i) => i !== orGroupIndex)
  const orLetters = split(target[orGroupIndex], orRegex)
  const conditionalLetters = conditionalGroups
    .flatMap(c => split(c, arrowRegex))
    .map(clear)
    .map(not)

  if (
    compare(conditionalLetters[1], orLetters[0]) &&
    compare(conditionalLetters[3], orLetters[1])
  ) {
    return normalize(conditionalLetters[0], orSignal, conditionalLetters[2])
  }

  if (
    compare(conditionalLetters[1], orLetters[1]) &&
    compare(conditionalLetters[3], orLetters[0])
  ) {
    return normalize(conditionalLetters[0], orSignal, conditionalLetters[2])
  }

  throw new InvalidActionError()
}

/**
 * Absorption
 * @example
 * abs(['p -> q'],[0])//'p -> (p ^ q)'
 * //If p then q; therefore p then p and q
 */
export function abs(lines: string[], targetLines: number[]): string {
  if (targetLines.length === 0) {
    throw new MissingTargetLineError(targetLines.length, 1)
  }

  const target = lines[targetLines[0]]

  if (!arrowRegex.test(target)) {
    throw new InvalidActionError()
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

  const target = targets(lines, targetLines).map(prune)

  if (target.filter(t => strictLetterRegex.test(t)).length !== target.length) {
    throw new InvalidActionError()
  }

  return normalize(target.join(andSignal))
}
