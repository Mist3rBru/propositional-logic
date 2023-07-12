import { resolve } from './index'

describe('resolve', () => {
  it('exceptions', () => {
    const result = resolve(['mp -1 1', 'mp 1 4'])

    expect(result).toStrictEqual([
      `linha '-1' não encontrada`,
      `linha '4' não encontrada`
    ])
  })

  it('ex01', () => {
    const base = ['~p -> ~q v r', ' s v (r -> t)', ' ~p v s', ' ~s', ' q']
    const answers = [
      'sd 3 4',
      'mp 1 6',
      'sd 5 7',
      'sd 2 4',
      'mp 8 9',
      'ad u 10'
    ]

    const result = resolve(answers, base)

    expect(result).toStrictEqual(
      base.concat(['~p', '~q v r', 'r', 'r -> t', 't', 't v u'])
    )
  })

  it('ex02', () => {
    const base = ['~p v s', 'p ^ q', 's ^ ~r -> ~t', 'q -> ~r']
    const answers = [
      'SIM p em 2',
      'SIM q em 2',
      'SD em 1 e 5',
      'MP em 4 e 6',
      'CONJ em 7 e 8',
      'MP em 3 e 9',
      'AD u em 10',
      'COND em 11'
    ]

    const result = resolve(answers, base)

    expect(result).toStrictEqual(
      base.concat(['p', 'q', 's', '~r', 's ^ ~r', '~t', '~t v u', 't -> u'])
    )
  })

  it('ex03', () => {
    const base = ['~s v (~q v r)', 's ->  (r -> t)', '~p -> s', '~p', 'q']
    const answers = [
      'MP em 3 e 4',
      'SD em 1 e 6',
      'SD em 5 e 7',
      'MP em 2 e 6',
      'MP em 8 e 9',
      'AD u em 10'
    ]

    const result = resolve(answers, base)

    expect(result).toStrictEqual(
      base.concat(['s', '~q v r', 'r', 'r -> t', 't', 't v u'])
    )
  })

  it('ex04', () => {
    const base = [
      '(p v ~t) -> ~q',
      '~m-> u',
      '~t v ~m',
      'p  V  r',
      '~s -> ~u v ~r',
      'q'
    ]
    const answers = [
      'MT em 1 e 6',
      'DM em 7',
      'SIM ~p em 8',
      'SIM t em 8',
      'SD em 4 e 9',
      'SD em 3 e 10',
      'MP em 2 e 12',
      'CONJ em 13 e 11',
      'DM em 14',
      'MT em 5 e 15',
      'DN em 16'
    ]

    const result = resolve(answers, base)

    expect(result).toStrictEqual(
      base.concat([
        '~(p v ~t)',
        '~p ^ t',
        '~p',
        't',
        'r',
        '~m',
        'u',
        'u ^ r',
        '~(~u v ~r)',
        '~~s',
        's'
      ])
    )
  })
})
