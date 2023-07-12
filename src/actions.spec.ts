import {
  abs,
  ad,
  ass,
  bi,
  com,
  cond,
  conj,
  cp,
  dc,
  dd,
  dis,
  dm,
  dn,
  ip,
  mp,
  mt,
  sd,
  sh,
  sim
} from './actions'
import { invalidActionMessage } from './utils'

const make = (...lines: string[]): [string[], number[]] => {
  return [lines, lines.map((_, i) => i)]
}

/**
 * TEST FLOW
 * insufficient params test
 * simple case test
 * inverted simple case test
 * compound case test
 * exception case test
 * ? particular case tests
 */
describe('actions', () => {
  describe('equivalence', () => {
    it('dn: should resolve double not', () => {
      expect(dn(...make())).toBe('')
      expect(dn(...make('m'))).toBe(invalidActionMessage)
      expect(dn(...make('~m'))).toBe(invalidActionMessage)
      expect(dn(...make('~~m'))).toBe('m')
    })

    it('ip: should simplify conjunction/disjunction', () => {
      expect(ip(...make())).toBe('')
      expect(ip(...make('m v m'))).toBe('m')
      expect(ip(...make('m ^ m'))).toBe('m')
      expect(ip(...make('m ^ b v m ^ b'))).toBe('m ^ b')
      expect(ip(...make('m'))).toBe(invalidActionMessage)
      expect(ip(...make('m ^ b'))).toBe(invalidActionMessage)
    })

    it('com: should switch conjunction/disjunction sides', () => {
      expect(com(...make())).toBe('')
      expect(com(...make('m v r'))).toBe('r v m')
      expect(com(...make('m ^ r'))).toBe('r ^ m')
      expect(com(...make('m'))).toBe(invalidActionMessage)
    })

    it('ass: should reassociate conjunction/disjunction', () => {
      expect(ass(...make())).toBe('')
      expect(ass(...make('(m v q) v r'))).toBe('m v (q v r)')
      expect(ass(...make('m ^ (q ^ r)'))).toBe('(m ^ q) ^ r')
      expect(ass(...make('m ^ ~q'))).toBe(invalidActionMessage)
      expect(ass(...make('m'))).toBe(invalidActionMessage)
    })

    it('dm: should invert/resolve group logic', () => {
      expect(dm(...make())).toBe('')
      expect(dm(...make('m ^ r'))).toBe('~(~m v ~r)')
      expect(dm(...make('~m ^ ~r'))).toBe('~(m v r)')
      expect(dm(...make('~(m v r)'))).toBe('~m ^ ~r')
      expect(dm(...make('~(m v ~r)'))).toBe('~m ^ r')
      expect(dm(...make('m'))).toBe(invalidActionMessage)
      expect(dm(...make('~~m'))).toBe(invalidActionMessage)
    })

    it('dis: should resolve distribution', () => {
      expect(dis(...make())).toBe('')
      expect(dis(...make('r ^ (~m v q)'))).toBe('(r ^ ~m) v (r ^ q)')
      expect(dis(...make('(~m v q) ^ r'))).toBe('(r ^ ~m) v (r ^ q)')
      expect(dis(...make('r v (m ^ q)'))).toBe('(r v m) ^ (r v q)')
      expect(dis(...make('m'))).toBe(invalidActionMessage)
    })

    it('cp: should invert both logic sides', () => {
      expect(cp(...make())).toBe('')
      expect(cp(...make('m -> r'))).toBe('~m -> ~r')
      expect(cp(...make('m v r'))).toBe('~m v ~r')
      expect(cp(...make('m ^ r'))).toBe('~m ^ ~r')
      expect(cp(...make('m ^ r -> u'))).toBe('~m ^ ~r -> ~u')
      expect(cp(...make('~(m ^ r) -> u'))).toBe('~~(m ^ r) -> ~u')
      expect(cp(...make('m'))).toBe(invalidActionMessage)
      expect(cp(...make('~~m'))).toBe(invalidActionMessage)
    })

    it('cond: invert and switch condicional sides', () => {
      expect(cond(...make())).toBe('')
      expect(cond(...make('m -> r'))).toBe('~r -> ~m')
      expect(cond(...make('~m -> ~r'))).toBe('~~r -> ~~m')
      expect(cond(...make('m'))).toBe(invalidActionMessage)

      expect(cond(...make('~t v u'))).toBe('t -> u')
    })

    it('bi: should resolve distribution of bi direcional condicional', () => {
      expect(bi(...make())).toBe('')
      expect(bi(...make('m <-> r'))).toBe('(m -> r) ^ (r -> m)')
      expect(bi(...make('~m <-> ~r'))).toBe('(~m -> ~r) ^ (~r -> ~m)')
      expect(bi(...make('m'))).toBe(invalidActionMessage)
    })
  })

  describe('inference', () => {
    it('ad: should add letter to line', () => {
      expect(ad(...make())).toBe('')
      expect(ad(...make('m', 'ad r em 1'))).toBe('m v r')
      expect(ad(...make('~m', '~r'))).toBe('~m v ~r')
      expect(ad(...make('m -> r', 'r'))).toBe(invalidActionMessage)
    })

    it('sim: should simplify conjunction', () => {
      expect(sim(...make())).toBe('')
      expect(sim(...make('m ^ r -> m'))).toBe('m ^ r -> r')
      expect(sim(...make('~m ^ ~r -> ~r'))).toBe('~m ^ ~r -> ~m')
      expect(sim(...make('m -> r'))).toBe(invalidActionMessage)

      expect(sim(...make('m ^ r', 'm'))).toBe('m')
      expect(sim(...make('m ^ r', 'r'))).toBe('r')
      expect(sim(...make('m ^ ~(t v q)', 'sim ~(tvq) 1'))).toBe('~(t v q)')
    })

    it('mp: should return assertion result', () => {
      expect(mp(...make())).toBe('')
      expect(mp(...make('m', 'm -> r'))).toBe('r')
      expect(mp(...make('m -> r', 'm'))).toBe('r')
      expect(mp(...make('m ^ r', 'm ^ r -> u'))).toBe('u')
      expect(mp(...make('m'))).toBe('')
      expect(mp(...make('m', 'r'))).toBe(invalidActionMessage)

      expect(mp(...make('s', 's -> (r -> t)'))).toBe('r -> t')
    })

    it('mt: should return inverted assertion requirement', () => {
      expect(mt(...make())).toBe('')
      expect(mt(...make('~r', 'm -> r'))).toBe('~m')
      expect(mt(...make('m -> r', '~r'))).toBe('~m')
      expect(mt(...make('~m ^ ~r', 'u -> m ^ r'))).toBe('~u')
      expect(mt(...make('m'))).toBe('')
      expect(mt(...make('m', 'r'))).toBe(invalidActionMessage)

      expect(mt(...make('~m', '~r -> m'))).toBe('~~r')
      expect(mt(...make('~m', 'p v ~q -> m'))).toBe('~(p v ~q)')
      expect(mt(...make('~s -> ~u v ~r', '~(~uv~r)'))).toBe('~~s')
    })

    it('sd: should resolve OR group', () => {
      expect(sd(...make())).toBe('')
      expect(sd(...make('~m', 'm v r'))).toBe('r')
      expect(sd(...make('m v r', '~m'))).toBe('r')
      expect(sd(...make('m v r', '~r'))).toBe('m')
      expect(sd(...make('m', '~m v (~q v r)'))).toBe('~q v r')
      expect(sd(...make('m'))).toBe('')
      expect(sd(...make('m', 'r'))).toBe(invalidActionMessage)
    })

    it('sh: should resolve chained conditions', () => {
      expect(sh(...make())).toBe('')
      expect(sh(...make('m -> q', 'q -> r'))).toBe('m -> r')
      expect(sh(...make('q -> r', 'm -> q'))).toBe('m -> r')
      expect(sh(...make('m v q', 's -> r'))).toBe(invalidActionMessage)
      expect(sh(...make('m -> q', 's ^ r'))).toBe(invalidActionMessage)
      expect(sh(...make('m -> q', 's -> r'))).toBe(invalidActionMessage)
    })

    it('dc: should resolve constructive dilema', () => {
      expect(dc(...make())).toBe('')
      expect(dc(...make('(p → q) ∧ (r → s) ∧ (p v r)'))).toBe('q v s')
      expect(dc(...make('(p → ~q) ∧ (r → ~s) ∧ (p v r)'))).toBe('~q v ~s')
      expect(dc(...make('(~p → q) ∧ (~r → s) ∧ (~p v ~r)'))).toBe('q v s')
      expect(dc(...make('(~p → ~q) ∧ (~r → ~s) ∧ (~p v ~r)'))).toBe('~q v ~s')
      expect(dc(...make('(~p → ~q) ∧ (~r → ~s) ∧ (~r v ~p)'))).toBe('~q v ~s')
      expect(dc(...make('(p → q) ∧ (r → s) ∧ (~p v ~r)'))).toBe(
        invalidActionMessage
      )
      expect(dc(...make('(~p → ~q) ∧ (~p v ~r)'))).toBe(invalidActionMessage)
    })

    it('dd: should resolve destructive dilema', () => {
      expect(dd(...make())).toBe('')
      expect(dd(...make('(p → q) ∧ (r → s) ∧ (~q v ~s)'))).toBe('~p v ~r')
      expect(dd(...make('(~p → ~q) ∧ (~r → ~s) ∧ (q v s)'))).toBe('~~p v ~~r')
      expect(dd(...make('(~p → q) ∧ (~r → s) ∧ (~q v ~s)'))).toBe('~~p v ~~r')
      expect(dd(...make('(~p → q) ∧ (~r → s) ∧ (~s v ~q)'))).toBe('~~p v ~~r')
      expect(dd(...make('(p → q) ∧ (r → s) ∧ (q v s)'))).toBe(
        invalidActionMessage
      )
      expect(dd(...make('(~p → q) ∧ (~q v ~s)'))).toBe(invalidActionMessage)
    })

    it('abs: should absorve logic condition', () => {
      expect(abs(...make())).toBe('')
      expect(abs(...make('p -> q'))).toBe('p -> (p ^ q)')
      expect(abs(...make('p ^ t -> q'))).toBe('p ^ t -> (p ^ t ^ q)')
      expect(abs(...make('~(p ^ t) -> ~q'))).toBe('~(p ^ t) -> (~(p ^ t) ^ ~q)')
      expect(abs(...make('p v q'))).toBe(invalidActionMessage)
    })

    it('conj: should create a conjunction', () => {
      expect(conj(...make())).toBe('')
      expect(conj(...make('p'))).toBe('')
      expect(conj(...make('p', 'q'))).toBe('p ^ q')
      expect(conj(...make('~p', 'q'))).toBe('~p ^ q')
      expect(conj(...make('p -> r', 'q'))).toBe(invalidActionMessage)
      expect(conj(...make('p', 'q v r'))).toBe(invalidActionMessage)
    })
  })
})
