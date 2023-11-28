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
  first,
  global,
  group,
  strictGroupRegex,
  invertSignal,
  last,
  strictLetterRegex,
  mapNot,
  normalize,
  not,
  strictNotGroupRegex,
  notRegex,
  orRegex,
  orSignal,
  prune,
  resolve,
  split,
  targets,
  ungroup,
} from './utils'

describe('utils', () => {
  it('should catch LETTER', () => {
    expect(strictLetterRegex.test('w')).toBeTruthy()
    expect(strictLetterRegex.test('~w')).toBeTruthy()
    expect(strictLetterRegex.test('~~w')).toBeTruthy()
    expect(strictLetterRegex.test('~~~w')).toBeTruthy()
    expect(strictLetterRegex.test('v')).toBeFalsy()
    expect(strictLetterRegex.test('^')).toBeFalsy()
    expect(strictLetterRegex.test('->')).toBeFalsy()
    expect(strictLetterRegex.test('()')).toBeFalsy()
  })

  it('should catch SIMPLE ARROW', () => {
    expect(arrowRegex.test('->')).toBeTruthy()
    expect(arrowRegex.test('=>')).toBeTruthy()
    expect(arrowRegex.test('')).toBeTruthy()
    expect(arrowRegex.test('→')).toBeTruthy()
    expect(arrowRegex.test('−')).toBeTruthy()
    expect(arrowRegex.test('>')).toBeFalsy()
  })

  it('should catch BIDIRECIONAL ARROW', () => {
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
    expect(strictGroupRegex.test('()')).toBeTruthy()
    expect(strictGroupRegex.test('(qvr)')).toBeTruthy()
  })

  it('should catch NOT GROUP', () => {
    expect(strictNotGroupRegex.test('~()')).toBeTruthy()
    expect(strictNotGroupRegex.test('~(qvr)')).toBeTruthy()
    expect(strictNotGroupRegex.test('()')).toBeFalsy()
    expect(strictNotGroupRegex.test('(qvr)')).toBeFalsy()
  })

  it('should catch NOT signal', () => {
    expect(notRegex.test('~')).toBeTruthy()
    expect(notRegex.test('~q')).toBeTruthy()
    expect(notRegex.test('~~q')).toBeTruthy()
  })

  it('should catch DOUBLE NOT signal', () => {
    expect(doubleNotRegex.test('~')).toBeFalsy()
    expect(doubleNotRegex.test('~q')).toBeFalsy()
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
    expect(ungroup('m^~(tvq)')).toBe('m^~(tvq)')
    expect(ungroup('(~p^~q)->(~r^~s)')).toBe('(~p^~q)->(~r^~s)')
  })

  it('should add GROUP line', () => {
    expect(group('p')).toBe('(p)')
    expect(group('(p')).toBe('(p)')
    expect(group('p)')).toBe('(p)')
    expect(group('(p)')).toBe('(p)')
    expect(group('pvq')).toBe('(pvq)')
    expect(group('~pv~q')).toBe('(~pv~q)')
    expect(group('(pvq)')).toBe('(pvq)')
    expect(group('~(pvq)')).toBe('~(pvq)')
    expect(group('(pvq) v r')).toBe('((pvq) v r)')
    expect(group('(pvq) v rvs')).toBe('((pvq) v rvs)')
    expect(group('(pvq) v (rvs)')).toBe('((pvq) v (rvs))')
    expect(group('pvq) v (rvs')).toBe('(pvq) v (rvs)')
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
    expect(global(sut).global).toBeTruthy()
    expect(global(global(sut)).global).toBeTruthy()
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
    expect(invertSignal('qvr^s')).toBe('q^rvs')
  })

  it('should return FIRST item', () => {
    expect(first(['p'])).toBe('p')
    expect(first(['p', 'q'])).toBe('p')
    expect(first(['p', 'q', 'r'])).toBe('p')
  })

  it('should return LAST item', () => {
    expect(last(['p'])).toBe('p')
    expect(last(['p', 'q'])).toBe('q')
    expect(last(['p', 'q', 'r'])).toBe('r')
  })

  it('should return TARGETS', () => {
    expect(targets(['p'], [])).toStrictEqual([])
    expect(targets(['p'], [0])).toStrictEqual(['p'])
    expect(targets(['p', 'q'], [0])).toStrictEqual(['p'])
    expect(targets(['p', 'q'], [0, 1])).toStrictEqual(['p', 'q'])
    expect(targets(['p', 'q', 'r'], [1, 2])).toStrictEqual(['q', 'r'])
    expect(targets(['p', 'q', 'r'], [2])).toStrictEqual(['r'])
  })
})
