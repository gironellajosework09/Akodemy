import { describe, it, expect, beforeEach } from 'vitest'
import { CanonicalTestConverter } from '../../services/canonical/testConverter.js'

describe('CanonicalTestConverter', () => {
  let converter

  beforeEach(() => {
    converter = new CanonicalTestConverter()
  })

  describe('normalizeValue', () => {
    it('should handle null values', () => {
      expect(converter.normalizeValue(null)).toBe(null)
    })

    it('should handle undefined values', () => {
      expect(converter.normalizeValue(undefined)).toBe(null)
    })

    it('should preserve strings', () => {
      expect(converter.normalizeValue('hello')).toBe('hello')
    })

    it('should preserve numbers', () => {
      expect(converter.normalizeValue(42)).toBe(42)
      expect(converter.normalizeValue(3.14)).toBe(3.14)
    })

    it('should handle non-finite numbers', () => {
      expect(converter.normalizeValue(Infinity)).toBe(null)
      expect(converter.normalizeValue(NaN)).toBe(null)
    })

    it('should preserve booleans', () => {
      expect(converter.normalizeValue(true)).toBe(true)
      expect(converter.normalizeValue(false)).toBe(false)
    })

    it('should normalize arrays recursively', () => {
      expect(converter.normalizeValue([1, 2, 3])).toEqual([1, 2, 3])
      expect(converter.normalizeValue(['a', 'b'])).toEqual(['a', 'b'])
    })

    it('should normalize objects recursively', () => {
      expect(converter.normalizeValue({ a: 1, b: 'test' })).toEqual({ a: 1, b: 'test' })
    })

    it('should preserve error objects', () => {
      expect(converter.normalizeValue({ error: 'invalid input' })).toEqual({ error: 'invalid input' })
    })
  })

  describe('normalizeDescription', () => {
    it('should trim whitespace', () => {
      expect(converter.normalizeDescription('  hello  ')).toBe('hello')
    })

    it('should normalize multiple spaces when enabled', () => {
      converter.normalizeWhitespace = true
      expect(converter.normalizeDescription('hello   world')).toBe('hello world')
    })

    it('should handle empty strings', () => {
      expect(converter.normalizeDescription('')).toBe('')
    })

    it('should handle null/undefined', () => {
      expect(converter.normalizeDescription(null)).toBe('')
      expect(converter.normalizeDescription(undefined)).toBe('')
    })
  })

  describe('extractCases', () => {
    it('should extract cases from flat structure', () => {
      const canonicalData = {
        exercise: 'test',
        cases: [
          { uuid: '1', description: 'test 1', property: 'solve', input: {}, expected: 1 },
          { uuid: '2', description: 'test 2', property: 'solve', input: {}, expected: 2 }
        ]
      }
      const cases = converter.extractCases(canonicalData)
      expect(cases).toHaveLength(2)
      expect(cases[0].uuid).toBe('1')
      expect(cases[1].uuid).toBe('2')
    })

    it('should extract cases from nested structure', () => {
      const canonicalData = {
        exercise: 'test',
        cases: [
          {
            description: 'group 1',
            cases: [
              { uuid: '1', description: 'test 1', property: 'solve', input: {}, expected: 1 }
            ]
          },
          {
            description: 'group 2',
            cases: [
              { uuid: '2', description: 'test 2', property: 'solve', input: {}, expected: 2 }
            ]
          }
        ]
      }
      const cases = converter.extractCases(canonicalData)
      expect(cases).toHaveLength(2)
    })

    it('should skip reimplemented tests when enabled', () => {
      converter.skipReimplemented = true
      const canonicalData = {
        exercise: 'test',
        cases: [
          { uuid: '1', description: 'original', property: 'solve', input: {}, expected: 1 },
          { uuid: '2', description: 'reimplemented', property: 'solve', input: {}, expected: 2, reimplements: '1' }
        ]
      }
      const cases = converter.extractCases(canonicalData)
      expect(cases).toHaveLength(1)
      expect(cases[0].uuid).toBe('2')
    })
  })

  describe('normalizeCase', () => {
    it('should normalize a complete test case', () => {
      const testCase = {
        uuid: '123',
        description: '  Test case  ',
        property: 'solve',
        input: { value: 42 },
        expected: 84
      }
      const normalized = converter.normalizeCase(testCase, 'test-exercise')
      expect(normalized.uuid).toBe('123')
      expect(normalized.description).toBe('Test case')
      expect(normalized.property).toBe('solve')
      expect(normalized.input).toEqual({ value: 42 })
      expect(normalized.expected).toBe(84)
    })

    it('should use exercise name as property when not specified', () => {
      const testCase = {
        uuid: '123',
        description: 'Test',
        input: {},
        expected: 1
      }
      const normalized = converter.normalizeCase(testCase, 'hello-world')
      expect(normalized.property).toBe('hello-world')
    })
  })
})
