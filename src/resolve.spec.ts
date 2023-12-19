import { InvalidActionError, InvalidLineError } from './errors'
import { resolve as sut } from './resolve'
import { normalize } from './utils'

describe('resolve', () => {
  describe('single line', () => {
    it('should throw InvalidActionError', () => {
      const rejection = () => sut('1 2', [], { throwOnError: true })

      expect(rejection).toThrow(InvalidActionError)
    })

    it('should return InvalidActionError.message', () => {
      const result = sut('1 2', ['', ''], { throwOnError: false })

      expect(result).toBe(new InvalidActionError().message)
    })

    it('should throw InvalidLineError', () => {
      const rejection = () => sut('mp -1 2', ['', ''], { throwOnError: true })

      expect(rejection).toThrow(InvalidLineError)
    })

    it('should return InvalidLineError.message', () => {
      const result = sut('mp 1 4', ['', ''], { throwOnError: false })

      expect(result).toBe(new InvalidLineError(4).message)
    })

    it('should throw inner InvalidActionError', () => {
      const rejection = () =>
        sut('mp 1 2', ['q -> r', 't'], { throwOnError: true })

      expect(rejection).toThrow(new InvalidActionError())
    })

    it('should return inner InvalidActionError.message', () => {
      const result = sut('mp 1 2', ['q -> r', 't'], { throwOnError: false })

      expect(result).toBe(new InvalidActionError().message)
    })

    it('should return action result', () => {
      const result = sut('mp 1 2', ['p -> q', 'p'])

      expect(result).toBe('q')
    })
  })

  describe('multi lines', () => {
    it('should throw InvalidActionError', () => {
      const rejection = () => sut(['q -> r', 's', 'mp 1 2'])

      expect(rejection).toThrow(InvalidActionError)
    })

    it('should throw InvalidLineError', () => {
      const rejection = () => sut(['mp -1 1'])

      expect(rejection).toThrow(InvalidLineError)
    })

    it('should list exceptions', () => {
      const result = sut(['mp -1 1', 'mp 1 4', '1 2'], [], {
        throwOnError: false,
      })

      expect(result).toStrictEqual([
        new InvalidLineError(-1).message,
        new InvalidLineError(4).message,
        new InvalidActionError().message,
      ])
    })

    describe('examples', () => {
      it('should result example 01', () => {
        const base = ['~p -> ~q v r', 's v (r -> t)', '~p v s', '~s', 'q']
        const answers = [
          'sd 3 4',
          'mp 1 6',
          'sd 5 7',
          'sd 2 4',
          'mp 8 9',
          'ad u 10',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~p',
              '~q v r',
              'r',
              'r -> t',
              't',
              't v u',
              //  't v u'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 02', () => {
        const base = ['~p v s', 'p ^ q', 's ^ ~r -> ~t', 'q -> ~r']
        const answers = [
          'SIM p em 2',
          'SIM q em 2',
          'SD em 1 e 5',
          'MP em 4 e 6',
          'CONJ em 7 e 8',
          'MP em 3 e 9',
          'AD u em 10',
          'COND em 11',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat(['p', 'q', 's', '~r', 's ^ ~r', '~t', '~t v u', 't -> u'])
            .map(g => normalize(g))
        )
      })

      it('should result example 03', () => {
        const base = ['~s v (~q v r)', 's ->  (r -> t)', '~p -> s', '~p', 'q']
        const answers = [
          'MP em 3 e 4',
          'SD em 1 e 6',
          'SD em 5 e 7',
          'MP em 2 e 6',
          'MP em 8 e 9',
          'AD u em 10',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat(['s', '~q v r', 'r', 'r -> t', 't', 't v u'])
            .map(g => normalize(g))
        )
      })

      it('should result example 04', () => {
        const base = [
          '(p v ~t) -> ~q',
          '~m-> u',
          '~t v ~m',
          'p  V  r',
          '~s -> ~u v ~r',
          'q',
        ]
        const answers = [
          'DM 4',
          'CP 7',
          // ''
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~(~p ^ ~r)',
              '~p ^ ~r',
              // ~p ^ ~r
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 05', () => {
        const base = ['p → (q→ r)', 'p → q', 'p V s', '~s']
        const answers = ['SD 3 4', 'MP 1 5', 'SH 2 6', 'MP 5 7', 'AD t 8']

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              'p',
              'q -> r',
              'p -> r',
              'r',
              'r v t',
              // 'r v t'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 06', () => {
        const base = ['p -> r ^ t', 't -> ~s', 'p V u', 's']
        const answers = [
          'MT 4 2',
          'AD r 5',
          'COND 6',
          'MT 5 7',
          'CONJ 8 5',
          'MT 1 9',
          'SD 10 3',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~t',
              '~t v r',
              't -> r',
              '~r',
              '~r ^ ~t',
              '~p',
              'u',
              // 'u'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 07', () => {
        const base = ['p ^ q → r', 'r → s', 't→ ~u', 't', '~s v u']
        const answers = [
          'MP 3 4',
          'SD 5 6',
          'MT 2 7',
          'MT 1 8',
          'DM 9',
          'COND 10',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~u',
              '~s',
              '~r',
              '~(p ^ q)',
              '~p v ~q',
              'p -> ~q',
              //  'p -> ~q'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 08', () => {
        const base = ['q v ( r → t)', 'q → s', '~s→ (t→p)', '~s']
        const answers = ['MT 2 4', 'SD 1 5', 'MP 3 4', 'SH 6 7']

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~q',
              'r → t',
              't -> p',
              'r -> p',
              // 'r -> p'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 09', () => {
        const base = ['p → q', 'r →s', 'q v s → ~t', 't']
        const answers = [
          'MT 3 4',
          'DM 5',
          'SIM ~q 6',
          'MT 1 7',
          'SIM ~s 6',
          'MT 2 9',
          'CONJ 8 10',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~(q v s)',
              '~q ^ ~s',
              '~q',
              '~p',
              '~s',
              '~r',
              '~p ^ ~r',
              //  '~p ^ ~r'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 10', () => {
        const base = ['~p → ~q v r', 's v (r → t)', '~p v s', '~s', 'q']
        const answers = ['SD 3 4', 'MP 1 6', 'SD 5 7', 'SD 2 4', 'MP 8 9']

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~p',
              '~q v r',
              'r',
              'r → t',
              't',
              // 't'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 11', () => {
        const base = ['p → s', 'p ^ q', 's ^ r → ~t', 'q → r']
        const answers = [
          'SIM p 2',
          'SIM q 2',
          'MP 1 5',
          'MP 4 6',
          'CONJ 7 8',
          'MP 9 3',
          'AD u 10',
          'COND 11',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              'p',
              'q',
              's',
              'r',
              's ^ r',
              '~t',
              '~t v u',
              't -> u',
              // 't -> u'
            ])
            .map(g => normalize(g))
        )
      })

      it('should result example 12', () => {
        const base = ['s v ~q', 'p → q', 'r v (t ^ ~s)']
        const answers = [
          'DM 1',
          'SIM s 4',
          'SIM ~q 4',
          'MT 2 6',
          'DM 3',
          'SIM r 8',
          'CONJ 7 9',
        ]

        const result = sut(answers, base, { throwOnError: false })

        expect(result).toStrictEqual(
          base
            .concat([
              '~(~s ^ q)',
              's',
              '~q',
              '~p',
              '~(~r ^ ~(~t v s)',
              'r',
              '~p ^ r',
              // '~p v r'
            ])
            .map(g => normalize(g))
        )
      })
    })
  })
})
