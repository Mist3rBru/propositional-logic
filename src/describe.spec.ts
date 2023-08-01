import { describe as sut } from './describe'

describe('describe', () => {
  it('should describe letter', () => {
    expect(sut('a')).toBe('"a" is true')
    expect(sut('~a')).toBe('"a" is false')
  })

  it('should describe logic operators', () => {
    expect(sut('a ^ b')).toBe('"a" is true and "b" is true')
    expect(sut('~a ^ ~b')).toBe('"a" is false and "b" is false')
    expect(sut('a v b')).toBe('"a" is true or "b" is true')
    expect(sut('~a v ~b')).toBe('"a" is false or "b" is false')
    expect(sut('a -> b')).toBe('if "a" is true, then "b" is true')
  })

  it('should describe mixed operators', () => {
    expect(sut('a ^ b v c')).toBe('"a" is true and "b" is true, or "c" is true')
    expect(sut('a v b ^ c')).toBe('"a" is true, or "b" is true and "c" is true')
    expect(sut('a ^ b -> c')).toBe(
      'if "a" is true and "b" is true, then "c" is true'
    )
    expect(sut('a v ~b -> ~c')).toBe(
      'if "a" is true or "b" is false, then "c" is false'
    )
  })
})
