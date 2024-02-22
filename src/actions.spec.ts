/* eslint-disable jest/valid-title */
import * as actions from './actions'
import { InvalidActionError, MissingTargetLineError } from './errors'

type Actions = typeof actions

type ActionKey = keyof Actions

const make = (...lines: string[]): [string[], number[]] => {
  return [lines, lines.map((_, i) => i)]
}

const makeSut = <TKey extends ActionKey>(key: TKey): Actions[TKey] => {
  return actions[key]
}

/**
 * TEST FLOW
 * simple case test
 * inverted simple case test
 * compound case test
 * exception case test
 * ? particular case tests
 */
describe('actions', () => {
  it('should throw MissingTargetLineError', () => {
    const actionsList = Object.values(actions)
    expect.assertions(actionsList.length)

    for (const action of actionsList) {
      expect(() => action([], [])).toThrow(MissingTargetLineError)
    }
  })

  describe('equivalence', () => {
    it('dn: should resolve double not', () => {
      const sut = makeSut('dn')
      expect(sut(...make('m'))).toBe('~~m')
      expect(sut(...make('~~m'))).toBe('m')
      expect(() => sut(...make('~m'))).toThrow(InvalidActionError)
    })

    it('ip: should simplify conjunction/disjunction', () => {
      const sut = makeSut('ip')
      expect(sut(...make('m v m'))).toBe('m')
      expect(sut(...make('m ^ m'))).toBe('m')
      expect(sut(...make('m ^ b v m ^ b'))).toBe('m ^ b')
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
      expect(() => sut(...make('m ^ b'))).toThrow(InvalidActionError)
    })

    it('com: should switch conjunction/disjunction sides', () => {
      const sut = makeSut('com')
      expect(sut(...make('m v r'))).toBe('r v m')
      expect(sut(...make('m ^ r'))).toBe('r ^ m')
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
    })

    it('ass: should reassociate conjunction/disjunction', () => {
      const sut = makeSut('ass')
      expect(sut(...make('(m v q) v r'))).toBe('m v (q v r)')
      expect(sut(...make('m ^ (q ^ r)'))).toBe('(m ^ q) ^ r')
      expect(() => sut(...make('m ^ ~q'))).toThrow(InvalidActionError)
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
    })

    it('dm: should invert/resolve group logic', () => {
      const sut = makeSut('dm')
      expect(sut(...make('~(a ^ b)'))).toBe('~a v ~b')
      expect(sut(...make('~a v ~b'))).toBe('~(a ^ b)')
      expect(sut(...make('(~a v b)'))).toBe('~(a ^ ~b)')
      expect(sut(...make('~a ^ b'))).toBe('~(a v ~b)')
      expect(sut(...make('~(a ^ b ^ c)'))).toBe('~a v ~b v ~c')
      expect(sut(...make('~(a v b) ^ ~(c v d)'))).toBe('(~a ^ ~b) v (~c ^ ~d)')
      expect(sut(...make('~(p v q) -> ~(r ^ s)'))).toBe(
        '(~p ^ ~q) -> (~r v ~s)'
      )
      expect(sut(...make('(~a v ~b) ^ (~c v ~d)'))).toBe('~(a ^ b) v ~(c ^ d)')
      expect(() => sut(...make('p'))).toThrow(InvalidActionError)
      expect(() => sut(...make('~~p'))).toThrow(InvalidActionError)
    })

    it('dis: should resolve distribution', () => {
      const sut = makeSut('dis')
      expect(sut(...make('p ^ (~q v r)'))).toBe('(p ^ ~q) v (p ^ r)')
      expect(sut(...make('(~p v q) ^ r'))).toBe('(r ^ ~p) v (r ^ q)')
      expect(sut(...make('~p v (q ^ r)'))).toBe('(~p v q) ^ (~p v r)')
      expect(sut(...make('p v (q ^ r ^ s)'))).toBe(
        '(p v q) ^ (p v r) ^ (p v s)'
      )
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
    })

    it('cp: should invert both logic sides', () => {
      const sut = makeSut('cp')
      expect(sut(...make('m -> r'))).toBe('~m -> ~r')
      expect(sut(...make('m v r'))).toBe('~m v ~r')
      expect(sut(...make('m ^ r'))).toBe('~m ^ ~r')
      expect(sut(...make('m ^ r -> u'))).toBe('~(m ^ r) -> ~u')
      expect(sut(...make('~(m ^ r) -> u'))).toBe('~~(m ^ r) -> ~u')
      expect(sut(...make('~(~p ^ ~r)'))).toBe('~p ^ ~r')
      expect(sut(...make('p v q → (r ^ s)'))).toBe('~(p v q) -> ~(r ^ s)')
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
      expect(() => sut(...make('~~m'))).toThrow(InvalidActionError)
    })

    it('cond: negate and switch condicional sides', () => {
      const sut = makeSut('cond')
      expect(sut(...make('p -> r'))).toBe('~r -> ~p')
      expect(sut(...make('~p -> ~r'))).toBe('~~r -> ~~p')
      expect(sut(...make('p -> q -> r'))).toBe('~r -> ~q -> ~p')
      expect(sut(...make('p v r'))).toBe('~p -> r')
      expect(sut(...make('p v q v r'))).toBe('~p -> (q v r)')
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
    })

    it('bi: should resolve distribution of bi direcional condicional', () => {
      const sut = makeSut('bi')
      expect(sut(...make('p <-> r'))).toBe('(p -> r) ^ (r -> p)')
      expect(sut(...make('~p <-> ~r'))).toBe('(~p -> ~r) ^ (~r -> ~p)')
      expect(sut(...make('p <-> q <-> r'))).toBe(
        '(p -> q -> r) ^ (r -> q -> p)'
      )
      expect(() => sut(...make('m'))).toThrow(InvalidActionError)
    })

    it('inv: should invert positions', () => {
      const sut = makeSut('inv')
      expect(sut(...make('p -> r'))).toBe('r -> p')
      expect(sut(...make('p v r'))).toBe('r v p')
      expect(sut(...make('p ^ r'))).toBe('r ^ p')
      expect(sut(...make('~(~s ^ ~t)'))).toBe('t ^ s')
    })
  })

  describe('inference', () => {
    it('ad: should add letter to line', () => {
      const sut = makeSut('ad')
      expect(sut(...make('m', 'ad r em 1'))).toBe('m v r')
      expect(sut(...make('~m', '~r'))).toBe('~m v ~r')
      expect(() => sut(...make('m -> r', 'r'))).toThrow(InvalidActionError)
    })

    it('sim: should simplify conjunction', () => {
      const sut = makeSut('sim')
      expect(sut(...make('m ^ r -> m'))).toBe('m ^ r -> r')
      expect(sut(...make('~m ^ ~r -> ~r'))).toBe('~m ^ ~r -> ~m')

      expect(sut(...make('m ^ r', 'm'))).toBe('m')
      expect(sut(...make('m ^ r', 'r'))).toBe('r')
      expect(sut(...make('m ^ ~(t v q)', 'sim ~tv~q 1'))).toBe('~t v ~q')
      expect(sut(...make('~(m ^ r)', '~m'))).toBe('~m')

      expect(() => sut(...make('m -> r'))).toThrow(InvalidActionError)
      expect(() => sut(...make('m ^ r', ''))).toThrow(InvalidActionError)
      expect(() => sut(...make('m ^ r', 's'))).toThrow(InvalidActionError)
    })

    it('mp: should return assertion result', () => {
      const sut = makeSut('mp')
      expect(sut(...make('m', 'm -> r'))).toBe('r')
      expect(sut(...make('m -> r', 'm'))).toBe('r')
      expect(sut(...make('m ^ r', 'm ^ r -> u'))).toBe('u')
      expect(sut(...make('~p ^ q', '~(p ^ ~q) -> ~(r v s)'))).toBe('~(r v s)')
      expect(sut(...make('s', 's -> (r -> t)'))).toBe('r -> t')
      expect(() => sut(...make('m', 'r'))).toThrow(InvalidActionError)
    })

    it('mt: should return inverted assertion requirement', () => {
      const sut = makeSut('mt')
      expect(sut(...make('m -> r', '~r'))).toBe('~m')
      expect(sut(...make('~r', 'm -> r'))).toBe('~m')
      expect(sut(...make('~m', 'm -> r'))).toBe('~r')
      expect(sut(...make('~m ^ ~r', 'u -> m ^ r'))).toBe('~u')
      expect(() => sut(...make('m', 'r'))).toThrow(InvalidActionError)

      expect(sut(...make('~m', '~r -> m'))).toBe('~~r')
      expect(sut(...make('~m', 'p v ~q -> m'))).toBe('~(p v ~q)')
      expect(sut(...make('~s -> ~u v ~r', '~(~uv~r)'))).toBe('~~s')
    })

    it('sd: should resolve OR group', () => {
      const sut = makeSut('sd')
      expect(sut(...make('~m', 'm v r'))).toBe('r')
      expect(sut(...make('m v r', '~m'))).toBe('r')
      expect(sut(...make('m v r', '~r'))).toBe('m')
      expect(sut(...make('m', '~m v (~q v r)'))).toBe('~q v r')
      expect(() => sut(...make('m', 'r'))).toThrow(InvalidActionError)
    })

    it('sh: should resolve chained conditions', () => {
      const sut = makeSut('sh')
      expect(sut(...make('m -> q -> r'))).toBe('m -> r')
      expect(sut(...make('m -> (q -> r)'))).toBe('m -> r')
      expect(sut(...make('m -> q', 'q -> r'))).toBe('m -> r')
      expect(sut(...make('q -> r', 'm -> q'))).toBe('m -> r')
      expect(sut(...make('q -> m', 'm -> (r -> s)'))).toBe('q -> s')
      expect(sut(...make('s -> p', 'm -> (r -> s)'))).toBe('m -> p')
      expect(() => sut(...make('m v q', 's -> r'))).toThrow(InvalidActionError)
      expect(() => sut(...make('m -> q', 's ^ r'))).toThrow(InvalidActionError)
      expect(() => sut(...make('m -> q', 's -> r'))).toThrow(InvalidActionError)
    })

    it('dc: should resolve constructive dilema', () => {
      const sut = makeSut('dc')
      expect(sut(...make('(p → q) ^ (r → s) ^ (p v r)'))).toBe('q v s')
      expect(sut(...make('(p → ~q) ^ (r → ~s) ^ (p v r)'))).toBe('~q v ~s')
      expect(sut(...make('(~p → q) ^ (~r → s) ^ (~p v ~r)'))).toBe('q v s')
      expect(sut(...make('(~p → ~q) ^ (~r → ~s) ^ (~p v ~r)'))).toBe('~q v ~s')
      expect(sut(...make('(~p → ~q) ^ (~r → ~s) ^ (~r v ~p)'))).toBe('~q v ~s')
      expect(() => sut(...make('(p → q) ^ (r → s) ^ (~p v ~r)'))).toThrow(
        InvalidActionError
      )
      expect(() => sut(...make('(~p → ~q) ^ (~p v ~r)'))).toThrow(
        InvalidActionError
      )
    })

    it('dd: should resolve destructive dilema', () => {
      const sut = makeSut('dd')
      expect(sut(...make('(p → q) ^ (r → s) ^ (~q v ~s)'))).toBe('~p v ~r')
      expect(sut(...make('(~p → ~q) ^ (~r → ~s) ^ (q v s)'))).toBe('~~p v ~~r')
      expect(sut(...make('(~p → q) ^ (~r → s) ^ (~q v ~s)'))).toBe('~~p v ~~r')
      expect(sut(...make('(~p → q) ^ (~r → s) ^ (~s v ~q)'))).toBe('~~p v ~~r')
      expect(() => sut(...make('(p → q) ^ (r → s) ^ (q v s)'))).toThrow(
        InvalidActionError
      )
      expect(() => sut(...make('(~p → q) ^ (~q v ~s)'))).toThrow(
        InvalidActionError
      )
    })

    it('abs: should absorve logic condition', () => {
      const sut = makeSut('abs')
      expect(sut(...make('p -> q'))).toBe('p -> (p ^ q)')
      expect(sut(...make('p ^ q -> r'))).toBe('p ^ q -> (p ^ q ^ r)')
      expect(sut(...make('~(p ^ q) -> r'))).toBe('~(p ^ q) -> (~(p ^ q) ^ r)')
      expect(sut(...make('~(p ^ q) -> (r -> s)'))).toBe(
        '~(p ^ q) -> (~(p ^ q) ^ (r -> s))'
      )
      expect(() => sut(...make('p v q'))).toThrow(InvalidActionError)
    })

    it('conj: should create a conjunction', () => {
      const sut = makeSut('conj')
      expect(sut(...make('p', 'q'))).toBe('p ^ q')
      expect(sut(...make('p', 'q', 'r'))).toBe('p ^ q ^ r')
      expect(sut(...make('~p', 'q', '~~r'))).toBe('~p ^ q ^ ~~r')
      expect(() => sut(...make('p -> q', 'r'))).toThrow(InvalidActionError)
      expect(() => sut(...make('p', 'q v r'))).toThrow(InvalidActionError)
    })
  })
})
