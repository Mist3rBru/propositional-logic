import { InvalidActionError } from './errors'
import { translate, pt } from './translate'
import * as LogicErrors from './errors'

describe('translate', () => {
  describe('to english', () => {
    it('should translate sentences to english', () => {
      const sut = (lines: string | string[]) => translate(lines, 'en')
      expect(sut('"a" is true')).toBe('"a" is true')
      expect(sut(['"a" is true', '"b" is false'])).toStrictEqual([
        '"a" is true',
        '"b" is false',
      ])
    })
  })

  describe('to portuguese', () => {
    const sut = (line: string) => translate(line, 'pt')

    it('should translate "is" cases', () => {
      expect(sut('"a" is true')).toBe('"a" é verdadeiro')
      expect(sut('"a" is false')).toBe('"a" é falso')
    })

    it('should translate "and" cases', () => {
      expect(sut('"a" is true and "b" is false')).toBe(
        '"a" é verdadeiro e "b" é falso'
      )
      expect(sut('"a" is false and "b" is true')).toBe(
        '"a" é falso e "b" é verdadeiro'
      )
      expect(sut('"a" and "b" are true')).toBe('"a" e "b" são verdadeiros')
      expect(sut('"a" and "b" are false')).toBe('"a" e "b" são falsos')
    })

    it('should translate "or" cases', () => {
      expect(sut('"a" is true or "b" is false')).toBe(
        '"a" é verdadeiro ou "b" é falso'
      )
      expect(sut('"a" is false or "b" is true')).toBe(
        '"a" é falso ou "b" é verdadeiro'
      )
      expect(sut('"a" is true or "b" is true')).toBe(
        '"a" é verdadeiro ou "b" é verdadeiro'
      )
      expect(sut('"a" is false or "b" is false')).toBe(
        '"a" é falso ou "b" é falso'
      )
    })

    it('should translate "then" cases', () => {
      expect(sut('if "a" is true, then "b" is true')).toBe(
        'se "a" é verdadeiro, então "b" é verdadeiro'
      )
      expect(sut('if and only if "a" is true, then "b" is true')).toBe(
        'se e somente se "a" é verdadeiro, então "b" é verdadeiro'
      )
      expect(sut('if "a" and "b" are true, then "c" is true')).toBe(
        'se "a" e "b" são verdadeiros, então "c" é verdadeiro'
      )
    })

    it('should translate "group" cases', () => {
      expect(sut('negation of ("a" and "b")')).toBe('negação de ("a" e "b")')
      expect(sut('"a" is true and ("b" is true or "c" is true)')).toBe(
        '"a" é verdadeiro e ("b" é verdadeiro ou "c" é verdadeiro)'
      )
    })

    it('should translate "list" cases', () => {
      expect(
        sut(
          'if "a" is true, then "b" is true; "a" is true; therefore "b" is true'
        )
      ).toBe(
        'se "a" é verdadeiro, então "b" é verdadeiro; "a" é verdadeiro; portanto "b" é verdadeiro'
      )
      expect(
        sut(
          '"a" is true and ("b" is true or "c" is true); therefore ("a" and "b" are true) or ("a" and "c" are true)'
        )
      ).toBe(
        '"a" é verdadeiro e ("b" é verdadeiro ou "c" é verdadeiro); portanto ("a" e "b" são verdadeiros) ou ("a" e "c" são verdadeiros)'
      )
      expect(
        sut(
          'if "a" is true, then "b" is true; therefore if "a" is false, then "b" is false'
        )
      ).toBe(
        'se "a" é verdadeiro, então "b" é verdadeiro; portanto se "a" é falso, então "b" é falso'
      )
    })

    it('should translate "exception" cases', () => {
      type LogicError = typeof LogicErrors
      const cases: {
        [K in keyof LogicError]: ConstructorParameters<LogicError[K]>
      } = {
        InvalidLineError: [1],
        MissingTargetLineError: [1, 2],
        InvalidActionError: [],
      }
      const caseList = Object.entries(cases)
      expect.assertions(caseList.length * 2)
      for (const [name, params] of caseList) {
        //@ts-ignore
        const error = new LogicErrors[name](...params)
        const expectedMessage = error.message.replace(
          pt.exceptions[name as keyof LogicError].regex,
          pt.exceptions[name as keyof LogicError].translation
        )
        expect(sut(error.message)).toBe(expectedMessage)

        //@ts-ignore
        const expectedError = new LogicErrors[name](...params)
        expectedError.message = expectedMessage
        expect(sut(error)).toStrictEqual(expectedError)
      }
    })
  })

  it('should not translate unsupported language', () => {
    // @ts-expect-error
    const sut = () => translate('"a" and "b"', 'invalidLanguage')
    expect(sut).toThrow(InvalidActionError)
  })
})
