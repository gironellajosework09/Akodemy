import { describe, it, expect } from 'vitest'
import {
  deepEqual,
  computeScore,
  isErrorExpected,
  formatTestResult,
  aggregateResults,
  getCompetency,
  validateExecutionContract
} from '../../services/canonical/executionContract.js'

describe('executionContract', () => {
  describe('deepEqual', () => {
    it('should return true for identical primitives', () => {
      expect(deepEqual(1, 1)).toBe(true)
      expect(deepEqual('hello', 'hello')).toBe(true)
      expect(deepEqual(true, true)).toBe(true)
    })

    it('should return false for different primitives', () => {
      expect(deepEqual(1, 2)).toBe(false)
      expect(deepEqual('hello', 'world')).toBe(false)
      expect(deepEqual(true, false)).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(deepEqual(null, null)).toBe(true)
      expect(deepEqual(undefined, undefined)).toBe(true)
      expect(deepEqual(null, undefined)).toBe(true)
      expect(deepEqual(undefined, null)).toBe(true)
      expect(deepEqual(null, 0)).toBe(false)
    })

    it('should compare arrays deeply', () => {
      expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
      expect(deepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
      expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
    })

    it('should compare nested arrays', () => {
      expect(deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true)
      expect(deepEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false)
    })

    it('should compare objects deeply', () => {
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
      expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    })

    it('should compare objects regardless of key order', () => {
      expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
    })

    it('should compare nested objects', () => {
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true)
      expect(deepEqual({ a: { b: 1 } }, { a: { b: 2 } })).toBe(false)
    })

    it('should handle NaN', () => {
      expect(deepEqual(NaN, NaN)).toBe(true)
    })
  })

  describe('computeScore', () => {
    it('should calculate percentage correctly', () => {
      expect(computeScore(5, 10)).toBe(50)
      expect(computeScore(10, 10)).toBe(100)
      expect(computeScore(0, 10)).toBe(0)
    })

    it('should round to nearest integer', () => {
      expect(computeScore(1, 3)).toBe(33)
      expect(computeScore(2, 3)).toBe(67)
    })

    it('should return 0 for zero total', () => {
      expect(computeScore(0, 0)).toBe(0)
    })
  })

  describe('isErrorExpected', () => {
    it('should return true for error objects', () => {
      expect(isErrorExpected({ error: 'something went wrong' })).toBe(true)
    })

    it('should return false for normal values', () => {
      expect(isErrorExpected(42)).toBe(false)
      expect(isErrorExpected('hello')).toBe(false)
      expect(isErrorExpected([1, 2, 3])).toBe(false)
      expect(isErrorExpected({ value: 42 })).toBe(false)
    })

    it('should return false for null', () => {
      expect(isErrorExpected(null)).toBe(false)
    })
  })

  describe('formatTestResult', () => {
    it('should format a passing test', () => {
      const testCase = {
        uuid: '123',
        description: 'test',
        property: 'solve',
        expected: 42
      }
      const result = formatTestResult(testCase, 42)
      expect(result.passed).toBe(true)
      expect(result.uuid).toBe('123')
    })

    it('should format a failing test', () => {
      const testCase = {
        uuid: '123',
        description: 'test',
        property: 'solve',
        expected: 42
      }
      const result = formatTestResult(testCase, 24)
      expect(result.passed).toBe(false)
      expect(result.actual).toBe(24)
    })

    it('should handle expected errors correctly', () => {
      const testCase = {
        uuid: '123',
        description: 'test',
        property: 'solve',
        expected: { error: 'invalid input' }
      }
      const result = formatTestResult(testCase, null, 'invalid input')
      expect(result.passed).toBe(true)
    })

    it('should fail when error expected but none thrown', () => {
      const testCase = {
        uuid: '123',
        description: 'test',
        property: 'solve',
        expected: { error: 'invalid input' }
      }
      const result = formatTestResult(testCase, 42)
      expect(result.passed).toBe(false)
    })
  })

  describe('aggregateResults', () => {
    it('should aggregate test results correctly', () => {
      const results = [
        { uuid: '1', description: 'test1', passed: true, expected: 1 },
        { uuid: '2', description: 'test2', passed: false, expected: 2, actual: 3 },
        { uuid: '3', description: 'test3', passed: true, expected: 3 }
      ]
      const aggregated = aggregateResults(results)
      expect(aggregated.total).toBe(3)
      expect(aggregated.passed).toBe(2)
      expect(aggregated.failed).toBe(1)
      expect(aggregated.score).toBe(67)
    })
  })

  describe('getCompetency', () => {
    it('should return Mastered for 90+', () => {
      expect(getCompetency(90).name).toBe('Mastered')
      expect(getCompetency(100).name).toBe('Mastered')
    })

    it('should return Proficient for 75-89', () => {
      expect(getCompetency(75).name).toBe('Proficient')
      expect(getCompetency(89).name).toBe('Proficient')
    })

    it('should return Developing for 50-74', () => {
      expect(getCompetency(50).name).toBe('Developing')
      expect(getCompetency(74).name).toBe('Developing')
    })

    it('should return Not Started for below 50', () => {
      expect(getCompetency(0).name).toBe('Not Started')
      expect(getCompetency(49).name).toBe('Not Started')
    })
  })

  describe('validateExecutionContract', () => {
    it('should validate a complete test case', () => {
      const testCase = {
        uuid: '123',
        description: 'test',
        property: 'solve',
        input: { value: 1 },
        expected: 2
      }
      const result = validateExecutionContract(testCase)
      expect(result.valid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('should report missing uuid', () => {
      const testCase = {
        description: 'test',
        property: 'solve',
        input: {},
        expected: 1
      }
      const result = validateExecutionContract(testCase)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.field === 'uuid')).toBe(true)
    })

    it('should report missing description', () => {
      const testCase = {
        uuid: '123',
        property: 'solve',
        input: {},
        expected: 1
      }
      const result = validateExecutionContract(testCase)
      expect(result.valid).toBe(false)
      expect(result.issues.some(i => i.field === 'description')).toBe(true)
    })
  })
})
