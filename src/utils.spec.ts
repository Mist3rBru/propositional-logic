import {
  andRegex,
  andSignal,
  arrowRegex,
  arrowSignal,
  biArrowRegex,
  biArrowSignal,
  catchSignal,
  clear,
  compare,
  doubleNotRegex,
  find,
  globalRegex,
  group,
  groupRegex,
  invertSignal,
  mapNot,
  normalize,
  not,
  notGroupRegex,
  notRegex,
  orRegex,
  orSignal,
  prune,
  resolve,
  split,
  ungroup
} from './utils'

describe('utils', () => {
  it('should catch simple arrows', () => {
    expect(arrowRegex.test('->')).toBeTruthy()
    expect(arrowRegex.test('=>')).toBeTruthy()
    expect(arrowRegex.test('')).toBeTruthy()
    expect(arrowRegex.test('→')).toBeTruthy()
    expect(arrowRegex.test('>')).toBeFalsy()
  })

  it('should catch bidirecional arrows', () => {
    expect(biArrowRegex.test('<->')).toBeTruthy()
    expect(biArrowRegex.test('<=>')).toBeTruthy()
    expect(biArrowRegex.test('<>')).toBeTruthy()
    expect(biArrowRegex.test('⇔')).toBeTruthy()
  })

  it('should catch OR signal', () => {
    expect(orRegex.test('∨')).toBeTruthy()
    expect(orRegex.test('v')).toBeTruthy()
    expect(orRegex.test('V')).toBeTruthy()
  })

  it('should catch AND signal', () => {
    expect(andRegex.test('^')).toBeTruthy()
    expect(andRegex.test('∧')).toBeTruthy()
  })

  it('should catch GROUP', () => {
    expect(groupRegex.test('()')).toBeTruthy()
    expect(groupRegex.test('(qvr)')).toBeTruthy()
  })

  it('should catch NOT GROUP', () => {
    expect(notGroupRegex.test('~()')).toBeTruthy()
    expect(notGroupRegex.test('~(qvr)')).toBeTruthy()
    expect(notGroupRegex.test('()')).not.toBeTruthy()
    expect(notGroupRegex.test('(qvr)')).not.toBeTruthy()
  })

  it('should catch NOT signal', () => {
    expect(notRegex.test('~')).toBeTruthy()
    expect(notRegex.test('~q')).toBeTruthy()
    expect(notRegex.test('~~q')).toBeTruthy()
  })

  it('should catch DOUBLE NOT signal', () => {
    expect(doubleNotRegex.test('~')).not.toBeTruthy()
    expect(doubleNotRegex.test('~q')).not.toBeTruthy()
    expect(doubleNotRegex.test('~~q')).toBeTruthy()
  })

  it('should CLEAR line', () => {
    expect(clear('  Qv  r ')).toBe('qv r')
    expect(clear('  q ^R ')).toBe('q ^r')
    expect(clear(' q ->r')).toBe('q ->r')
    expect(clear('(qvr)')).toBe('(qvr)')
  })

  it('should NORMALIZE line', () => {
    expect(normalize('  Qv  r ')).toBe('q v r')
    expect(normalize('  q ^R ')).toBe('q ^ r')
    expect(normalize(' q', '->', 'r')).toBe('q -> r')
    expect(normalize(' q', '->', '~r')).toBe('q -> ~r')
    expect(normalize('(qvr)')).toBe('(q v r)')
  })

  it('should add NOT to line', () => {
    expect(not('q')).toBe('~q')
    expect(not('~q')).toBe('~~q')
    expect(not('~~q')).toBe('~~~q')
    expect(not('qvr')).toBe('~(qvr)')
    expect(not('~qvr')).toBe('~(~qvr)')
    expect(not('(~qvr)')).toBe('~(~qvr)')
    expect(not('~(~qvr)')).toBe('~~(~qvr)')
  })

  it('should add MAP line with NOT function', () => {
    expect(mapNot('q')).toBe('~q')
    expect(mapNot('~q')).toBe('~~q')
    expect(mapNot('~~q')).toBe('~~~q')
    expect(mapNot('qvr')).toBe('~qv~r')
    expect(mapNot('~qvr')).toBe('~~qv~r')
    expect(mapNot('(~qvr)')).toBe('~(~~qv~r)')
    expect(mapNot('~(~qvr)')).toBe('~~(~~qv~r)')
  })

  it('should add UNGROUP line', () => {
    expect(ungroup('q')).toBe('q')
    expect(ungroup('(q')).toBe('q')
    expect(ungroup('q)')).toBe('q')
    expect(ungroup('(q)')).toBe('q')
    expect(ungroup('(qvr)')).toBe('qvr')
    expect(ungroup('~(qvr)')).toBe('~(qvr)')
  })

  it('should add GROUP line', () => {
    expect(group('q')).toBe('(q)')
    expect(group('(q')).toBe('(q)')
    expect(group('q)')).toBe('(q)')
    expect(group('(q)')).toBe('(q)')
    expect(group('qvr')).toBe('(qvr)')
    expect(group('(qvr)')).toBe('(qvr)')
    expect(group('~(qvr)')).toBe('~(qvr)')
    expect(group('(qvr) v s')).toBe('((qvr) v s)')
  })

  it('should RESOLVE line', () => {
    expect(resolve('r')).toBe('r')
    expect(resolve('~r')).toBe('~r')
    expect(resolve('~~r')).toBe('r')
    expect(resolve('~~~r')).toBe('~r')
    expect(resolve('~(qvr)')).toBe('~qv~r')
    expect(resolve('~(qv~r)')).toBe('~qvr')
    expect(resolve('~(~q^~r)')).toBe('q^r')
    expect(resolve('(qvr)')).toBe('qvr')
  })

  it('should PRUNE line', () => {
    expect(prune('  ( q   v  r )  ')).toBe('(qvr)')
  })

  it('should single SPLIT line', () => {
    expect(split('q -> r -> t', arrowRegex)).toStrictEqual(['q ', ' r -> t'])
    expect(split('q <-> r', biArrowRegex)).toStrictEqual(['q ', ' r'])
    expect(split('q v r v t', orRegex)).toStrictEqual(['q ', ' r v t'])
    expect(split('q v r ^ t', andRegex)).toStrictEqual(['q v r ', ' t'])
    expect(split('q v r v t', andRegex)).toStrictEqual(['q v r v t', ''])
  })

  it('should COMPARE cases', () => {
    expect(compare('(q v r)', '(qvr)')).toBeTruthy()
    expect(compare('(qvr)', 'qvr')).toBeTruthy()
    expect(compare('qvr)', '(qvr')).toBeTruthy()
    expect(compare('~(qvr)', '(~qv~r)')).toBeTruthy()
    expect(compare('~~(qvr)', 'qvr')).toBeTruthy()
    expect(compare('(qvr) ', '~(qvr)')).toBeFalsy()
  })

  it('should FIND regex case', () => {
    expect(find(arrowRegex, 'qvr', 'q->r')).toStrictEqual(['q->r', 'qvr'])
    expect(find(arrowRegex, 'q->r', 'qvr')).toStrictEqual(['q->r', 'qvr'])
  })

  it('should make regex GLOBAL', () => {
    const sut = /test/
    expect(sut.global).toBeFalsy()
    expect(globalRegex(sut).global).toBeTruthy()
    expect(globalRegex(globalRegex(sut)).global).toBeTruthy()
  })

  it('should CATCH SIGNAL', () => {
    expect(catchSignal('q^r')).toStrictEqual([andRegex, andSignal])

    expect(catchSignal('qvr')).toStrictEqual([orRegex, orSignal])
    expect(catchSignal('q^s v r')).toStrictEqual([orRegex, orSignal])

    expect(catchSignal('q->r')).toStrictEqual([arrowRegex, arrowSignal])
    expect(catchSignal('qvs->r')).toStrictEqual([arrowRegex, arrowSignal])

    expect(catchSignal('q<->r')).toStrictEqual([biArrowRegex, biArrowSignal])
    expect(catchSignal('q->s<->r')).toStrictEqual([biArrowRegex, biArrowSignal])
  })

  it('should INVERT SIGNAL', () => {
    expect(invertSignal('q^r')).toBe('qvr')
    expect(invertSignal('q^r^s')).toBe('qvrvs')
    expect(invertSignal('qvr')).toBe('q^r')
    expect(invertSignal('qvrvs')).toBe('q^r^s')
  })
})
