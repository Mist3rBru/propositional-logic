import { describe as sut } from './describe'

describe('describe', () => {
  it('should describe letter', () => {
    expect(sut('a')).toBe('"a" is true')
    expect(sut('~a')).toBe('"a" is false')
    expect(sut('~~a')).toBe('"a" is true')
    expect(sut('~~~a')).toBe('"a" is false')
  })

  it('should describe logic operators', () => {
    expect(sut('a ^ b')).toBe('"a" and "b" are true')
    expect(sut('~a ^ ~b')).toBe('"a" and "b" are false')
    expect(sut('a v b')).toBe('"a" is true or "b" is true')
    expect(sut('~a v ~b')).toBe('"a" is false or "b" is false')
    expect(sut('a -> b')).toBe('if "a" is true, then "b" is true')
    expect(sut('~a -> b')).toBe('if "a" is false, then "b" is true')
    expect(sut('a -> ~b')).toBe('if "a" is true, then "b" is false')
    expect(sut('a <-> b')).toBe('if and only if "a" is true, then "b" is true')
  })

  it('should describe mixed operators', () => {
    expect(sut('a ^ b v c')).toBe('"a" is true and "b" is true, or "c" is true')
    expect(sut('a v b ^ c')).toBe('"a" is true, or "b" is true and "c" is true')
    expect(sut('a ^ b -> c')).toBe('if "a" and "b" are true, then "c" is true')
    expect(sut('a v ~b -> ~c')).toBe(
      'if "a" is true or "b" is false, then "c" is false'
    )
  })

  it('should describe groups', () => {
    expect(sut('~(a ^ b)')).toBe('negation of ("a" and "b")')
    expect(sut('a ^ (b v c)')).toBe(
      '"a" is true and ("b" is true or "c" is true)'
    )
  })

  it('should describe a list', () => {
    expect(sut(['~~a', 'a'])).toBe('"a" is true; therefore "a" is true')
    expect(sut(['a -> b', 'a', 'b'])).toBe(
      'if "a" is true, then "b" is true; "a" is true; therefore "b" is true'
    )
    expect(sut(['a ^ (b v c)', '(a ^ b) v (a ^ c)'])).toBe(
      '"a" is true and ("b" is true or "c" is true); therefore ("a" and "b" are true) or ("a" and "c" are true)'
    )
    expect(sut(['a -> b', '~a -> ~b'])).toBe(
      'if "a" is true, then "b" is true; therefore if "a" is false, then "b" is false'
    )
  })

  it('should describe and translate', () => {
    expect(sut('a', 'en')).toBe('"a" is true')
    expect(sut('a', 'pt')).toBe('"a" é verdadeiro')
    expect(sut(['a', 'a -> b', 'b'], 'pt')).toBe(
      '"a" é verdadeiro; se "a" é verdadeiro, então "b" é verdadeiro; portanto "b" é verdadeiro'
    )
  })
})
