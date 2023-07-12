import * as actions from './actions'
import { MissingTargetLineError } from './errors'
import { invalidActionMessage } from './utils'

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
      expect(sut(...make('m'))).toBe(invalidActionMessage)
      expect(sut(...make('~m'))).toBe(invalidActionMessage)
      expect(sut(...make('~~m'))).toBe('m')
    })

    it('ip: should simplify conjunction/disjunction', () => {
      const sut = makeSut('ip')
      expect(sut(...make('m v m'))).toBe('m')
      expect(sut(...make('m ^ m'))).toBe('m')
      expect(sut(...make('m ^ b v m ^ b'))).toBe('m ^ b')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
      expect(sut(...make('m ^ b'))).toBe(invalidActionMessage)
    })

    it('com: should switch conjunction/disjunction sides', () => {
      const sut = makeSut('com')
      expect(sut(...make('m v r'))).toBe('r v m')
      expect(sut(...make('m ^ r'))).toBe('r ^ m')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
    })

    it('ass: should reassociate conjunction/disjunction', () => {
      const sut = makeSut('ass')
      expect(sut(...make('(m v q) v r'))).toBe('m v (q v r)')
      expect(sut(...make('m ^ (q ^ r)'))).toBe('(m ^ q) ^ r')
      expect(sut(...make('m ^ ~q'))).toBe(invalidActionMessage)
      expect(sut(...make('m'))).toBe(invalidActionMessage)
    })

    it('dm: should invert/resolve group logic', () => {
      const sut = makeSut('dm')
      expect(sut(...make('m ^ r'))).toBe('~(~m v ~r)')
      expect(sut(...make('~m ^ ~r'))).toBe('~(m v r)')
      expect(sut(...make('~(m v r)'))).toBe('~m ^ ~r')
      expect(sut(...make('~(m v ~r)'))).toBe('~m ^ r')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
      expect(sut(...make('~~m'))).toBe(invalidActionMessage)
    })

    it('dis: should resolve distribution', () => {
      const sut = makeSut('dis')
      expect(sut(...make('r ^ (~m v q)'))).toBe('(r ^ ~m) v (r ^ q)')
      expect(sut(...make('(~m v q) ^ r'))).toBe('(r ^ ~m) v (r ^ q)')
      expect(sut(...make('r v (m ^ q)'))).toBe('(r v m) ^ (r v q)')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
    })

    it('cp: should invert both logic sides', () => {
      const sut = makeSut('cp')
      expect(sut(...make('m -> r'))).toBe('~m -> ~r')
      expect(sut(...make('m v r'))).toBe('~m v ~r')
      expect(sut(...make('m ^ r'))).toBe('~m ^ ~r')
      expect(sut(...make('m ^ r -> u'))).toBe('~m ^ ~r -> ~u')
      expect(sut(...make('~(m ^ r) -> u'))).toBe('~~(m ^ r) -> ~u')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
      expect(sut(...make('~~m'))).toBe(invalidActionMessage)
    })

    it('cond: invert and switch condicional sides', () => {
      const sut = makeSut('cond')
      expect(sut(...make('m -> r'))).toBe('~r -> ~m')
      expect(sut(...make('~m -> ~r'))).toBe('~~r -> ~~m')
      expect(sut(...make('m'))).toBe(invalidActionMessage)

      expect(sut(...make('~t v u'))).toBe('t -> u')
    })

    it('bi: should resolve distribution of bi direcional condicional', () => {
      const sut = makeSut('bi')
      expect(sut(...make('m <-> r'))).toBe('(m -> r) ^ (r -> m)')
      expect(sut(...make('~m <-> ~r'))).toBe('(~m -> ~r) ^ (~r -> ~m)')
      expect(sut(...make('m'))).toBe(invalidActionMessage)
    })
  })

  describe('inference', () => {
    it('ad: should add letter to line', () => {
      const sut = makeSut('ad')
      expect(sut(...make('m', 'ad r em 1'))).toBe('m v r')
      expect(sut(...make('~m', '~r'))).toBe('~m v ~r')
      expect(sut(...make('m -> r', 'r'))).toBe(invalidActionMessage)
    })

    it('sim: should simplify conjunction', () => {
      const sut = makeSut('sim')
      expect(sut(...make('m ^ r -> m'))).toBe('m ^ r -> r')
      expect(sut(...make('~m ^ ~r -> ~r'))).toBe('~m ^ ~r -> ~m')
      expect(sut(...make('m -> r'))).toBe(invalidActionMessage)

      expect(sut(...make('m ^ r', 'm'))).toBe('m')
      expect(sut(...make('m ^ r', 'r'))).toBe('r')
      expect(sut(...make('m ^ ~(t v q)', 'sim ~(tvq) 1'))).toBe('~(t v q)')
    })

    it('mp: should return assertion result', () => {
      const sut = makeSut('mp')
      expect(sut(...make('m', 'm -> r'))).toBe('r')
      expect(sut(...make('m -> r', 'm'))).toBe('r')
      expect(sut(...make('m ^ r', 'm ^ r -> u'))).toBe('u')
      expect(sut(...make('m', 'r'))).toBe(invalidActionMessage)

      expect(sut(...make('s', 's -> (r -> t)'))).toBe('r -> t')
    })

    it('mt: should return inverted assertion requirement', () => {
      const sut = makeSut('mt')
      expect(sut(...make('~r', 'm -> r'))).toBe('~m')
      expect(sut(...make('m -> r', '~r'))).toBe('~m')
      expect(sut(...make('~m ^ ~r', 'u -> m ^ r'))).toBe('~u')
      expect(sut(...make('m', 'r'))).toBe(invalidActionMessage)

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
      expect(sut(...make('m', 'r'))).toBe(invalidActionMessage)
    })

    it('sh: should resolve chained conditions', () => {
      const sut = makeSut('sh')
      expect(sut(...make('m -> q', 'q -> r'))).toBe('m -> r')
      expect(sut(...make('q -> r', 'm -> q'))).toBe('m -> r')
      expect(sut(...make('m v q', 's -> r'))).toBe(invalidActionMessage)
      expect(sut(...make('m -> q', 's ^ r'))).toBe(invalidActionMessage)
      expect(sut(...make('m -> q', 's -> r'))).toBe(invalidActionMessage)
    })

    it('dc: should resolve constructive dilema', () => {
      const sut = makeSut('dc')
      expect(sut(...make('(p → q) ∧ (r → s) ∧ (p v r)'))).toBe('q v s')
      expect(sut(...make('(p → ~q) ∧ (r → ~s) ∧ (p v r)'))).toBe('~q v ~s')
      expect(sut(...make('(~p → q) ∧ (~r → s) ∧ (~p v ~r)'))).toBe('q v s')
      expect(sut(...make('(~p → ~q) ∧ (~r → ~s) ∧ (~p v ~r)'))).toBe('~q v ~s')
      expect(sut(...make('(~p → ~q) ∧ (~r → ~s) ∧ (~r v ~p)'))).toBe('~q v ~s')
      expect(sut(...make('(p → q) ∧ (r → s) ∧ (~p v ~r)'))).toBe(
        invalidActionMessage
      )
      expect(sut(...make('(~p → ~q) ∧ (~p v ~r)'))).toBe(invalidActionMessage)
    })

    it('dd: should resolve destructive dilema', () => {
      const sut = makeSut('dd')
      expect(sut(...make('(p → q) ∧ (r → s) ∧ (~q v ~s)'))).toBe('~p v ~r')
      expect(sut(...make('(~p → ~q) ∧ (~r → ~s) ∧ (q v s)'))).toBe('~~p v ~~r')
      expect(sut(...make('(~p → q) ∧ (~r → s) ∧ (~q v ~s)'))).toBe('~~p v ~~r')
      expect(sut(...make('(~p → q) ∧ (~r → s) ∧ (~s v ~q)'))).toBe('~~p v ~~r')
      expect(sut(...make('(p → q) ∧ (r → s) ∧ (q v s)'))).toBe(
        invalidActionMessage
      )
      expect(sut(...make('(~p → q) ∧ (~q v ~s)'))).toBe(invalidActionMessage)
    })

    it('abs: should absorve logic condition', () => {
      const sut = makeSut('abs')
      expect(sut(...make('p -> q'))).toBe('p -> (p ^ q)')
      expect(sut(...make('p ^ t -> q'))).toBe('p ^ t -> (p ^ t ^ q)')
      expect(sut(...make('~(p ^ t) -> ~q'))).toBe('~(p ^ t) -> (~(p ^ t) ^ ~q)')
      expect(sut(...make('p v q'))).toBe(invalidActionMessage)
    })

    it('conj: should create a conjunction', () => {
      const sut = makeSut('conj')
      expect(sut(...make('p', 'q'))).toBe('p ^ q')
      expect(sut(...make('~p', 'q'))).toBe('~p ^ q')
      expect(sut(...make('p -> r', 'q'))).toBe(invalidActionMessage)
      expect(sut(...make('p', 'q v r'))).toBe(invalidActionMessage)
    })
  })
})