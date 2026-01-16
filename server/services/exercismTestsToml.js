// TOML parser for Exercism tests.toml files.
import * as toml from '@iarna/toml'

// Service logic for tests.toml parsing.
function flattenTests(items, parentDescription, tests) {
  if (!Array.isArray(items)) return

  for (const testCase of items) {
    if (testCase?.skip) continue
    if (testCase?.include === false) continue

    const rawName = testCase.description || testCase.name || testCase.property || 'Unnamed test'
    const fullName = parentDescription ? `${parentDescription} > ${rawName}` : rawName

    if (Array.isArray(testCase.cases)) {
      flattenTests(testCase.cases, fullName, tests)
      continue
    }

    const hasExpected = Object.prototype.hasOwnProperty.call(testCase, 'expected')
    const hasInput = Object.prototype.hasOwnProperty.call(testCase, 'input')

    tests.push({
      uuid: testCase.uuid || null,
      reimplements: testCase.reimplements || null,
      name: fullName,
      property: testCase.property || null,
      input: hasInput ? testCase.input : undefined,
      expected: hasExpected ? testCase.expected : undefined
    })
  }
}

export function parseTestsToml(tomlContent) {
  const parsed = toml.parse(tomlContent)
  const tests = []

  if (Array.isArray(parsed.tests)) {
    flattenTests(parsed.tests, '', tests)
  }
  if (Array.isArray(parsed.cases)) {
    flattenTests(parsed.cases, '', tests)
  }

  return {
    version: parsed['canonical-tests']?.version || null,
    tests
  }
}
