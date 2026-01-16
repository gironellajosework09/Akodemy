// Test generators for Exercism tests.toml data.
import path from 'path'

// Service logic for generating runnable tests per language.
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnakeCase(str) {
  return str.replace(/-/g, '_').replace(/([A-Z])/g, (_, c) => `_${c.toLowerCase()}`)
}

function toPascalCase(str) {
  return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
}

function isExpectedError(expected) {
  return expected && typeof expected === 'object' && Object.prototype.hasOwnProperty.call(expected, 'error')
}

function getErrorMessage(expected) {
  if (!isExpectedError(expected)) return null
  return typeof expected.error === 'string' ? expected.error : null
}

function getInputArgs(input) {
  if (input === undefined) return []
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return Object.values(input)
  }
  return [input]
}

function escapeJavaString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
}

function serializeJs(value) {
  if (value === undefined) return 'undefined'
  if (Number.isNaN(value)) return 'NaN'
  if (value === Infinity) return 'Infinity'
  if (value === -Infinity) return '-Infinity'
  return JSON.stringify(value)
}

function serializePython(value) {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return 'float("nan")'
    if (value === Infinity) return 'float("inf")'
    if (value === -Infinity) return 'float("-inf")'
    return String(value)
  }
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (Array.isArray(value)) {
    return `[${value.map(serializePython).join(', ')}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([key, val]) => `${JSON.stringify(key)}: ${serializePython(val)}`)
    return `{${entries.join(', ')}}`
  }
  return JSON.stringify(String(value))
}

function serializeJavaValue(value) {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return `"${escapeJavaString(value)}"`
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return String(value).includes('.') ? String(value) : `${value}.0`
  }
  if (typeof value === 'boolean') return `Boolean.valueOf(${value})`
  if (Array.isArray(value)) {
    if (value.length === 0) return 'java.util.Collections.emptyList()'
    if (typeof value[0] === 'number') {
      return `java.util.Arrays.asList(${value.map(v => Number.isInteger(v) ? v : `${v}.0`).join(', ')})`
    }
    if (typeof value[0] === 'string') {
      return `java.util.Arrays.asList(${value.map(v => `"${escapeJavaString(v)}"`).join(', ')})`
    }
    return `java.util.Arrays.asList(${value.map(v => serializeJavaValue(v)).join(', ')})`
  }
  if (typeof value === 'object') {
    return `"${escapeJavaString(JSON.stringify(value))}"`
  }
  return `"${escapeJavaString(String(value))}"`
}

function sanitizeTestName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

function getFunctionNames(tests, defaultName, transform) {
  const names = new Set()
  for (const test of tests) {
    const raw = test.property || defaultName
    names.add(transform(raw))
  }
  return Array.from(names)
}

export function generateJestTests(slug, tests) {
  const defaultName = slug
  const fnNames = getFunctionNames(tests, defaultName, toCamelCase)

  const lines = []
  lines.push('// Jest tests generated from Exercism tests.toml.')
  lines.push(`import { ${fnNames.join(', ')} } from './${slug}.js'`)
  lines.push('')
  lines.push(`describe(${JSON.stringify(slug)}, () => {`)

  tests.forEach((test, index) => {
    const fnName = toCamelCase(test.property || defaultName)
    const args = getInputArgs(test.input)
    const argsLiteral = args.map(serializeJs).join(', ')
    const testName = test.name || `case ${index + 1}`

    lines.push(`  test(${JSON.stringify(testName)}, () => {`)
    if (isExpectedError(test.expected)) {
      const errorMessage = getErrorMessage(test.expected)
      if (errorMessage) {
        lines.push(`    expect(() => ${fnName}(${argsLiteral})).toThrow(${serializeJs(errorMessage)})`)
      } else {
        lines.push(`    expect(() => ${fnName}(${argsLiteral})).toThrow()`)
      }
    } else {
      lines.push(`    expect(${fnName}(${argsLiteral})).toEqual(${serializeJs(test.expected)})`)
    }
    lines.push('  })')
  })

  lines.push('})')
  return lines.join('\n')
}

export function generatePytestTests(slug, tests) {
  const moduleName = slug.replace(/-/g, '_')
  const defaultName = slug
  const fnNames = getFunctionNames(tests, defaultName, (name) => toSnakeCase(name).replace(/^_+/, ''))

  const lines = []
  lines.push('# Pytest tests generated from Exercism tests.toml.')
  lines.push('import pytest')
  lines.push(`from ${moduleName} import ${fnNames.join(', ')}`)
  lines.push('')

  tests.forEach((test, index) => {
    const fnName = toSnakeCase(test.property || defaultName).replace(/^_+/, '')
    const args = getInputArgs(test.input)
    const argsLiteral = args.map(serializePython).join(', ')
    const testName = sanitizeTestName(test.name || `case_${index + 1}`) || `case_${index + 1}`

    lines.push(`def test_${testName}():`)
    if (isExpectedError(test.expected)) {
      const errorMessage = getErrorMessage(test.expected)
      if (errorMessage) {
        lines.push(`    with pytest.raises(Exception, match=${serializePython(errorMessage)}):`)
        lines.push(`        ${fnName}(${argsLiteral})`)
      } else {
        lines.push('    with pytest.raises(Exception):')
        lines.push(`        ${fnName}(${argsLiteral})`)
      }
    } else {
      lines.push(`    assert ${fnName}(${argsLiteral}) == ${serializePython(test.expected)}`)
    }
    lines.push('')
  })

  return lines.join('\n')
}

export function generateJUnitTests(slug, tests) {
  const className = toPascalCase(slug)
  const defaultName = slug

  const lines = []
  lines.push('// JUnit tests generated from Exercism tests.toml.')
  lines.push('import org.junit.jupiter.api.Test;')
  lines.push('import static org.junit.jupiter.api.Assertions.*;')
  lines.push('import java.util.*;')
  lines.push('')
  lines.push(`public class ${className}Test {`)
  lines.push(`  private final ${className} solution = new ${className}();`)
  lines.push('')

  tests.forEach((test, index) => {
    const methodName = toCamelCase(test.property || defaultName)
    const args = getInputArgs(test.input)
    const argsLiteral = args.map(serializeJavaValue).join(', ')
    const testName = sanitizeTestName(test.name || `case_${index + 1}`) || `case_${index + 1}`

    lines.push('  @Test')
    lines.push(`  void test_${testName}() {`)
    if (isExpectedError(test.expected)) {
      const errorMessage = getErrorMessage(test.expected)
      lines.push(`    Exception ex = assertThrows(Exception.class, () -> solution.${methodName}(${argsLiteral}));`)
      if (errorMessage) {
        lines.push(`    assertTrue(ex.getMessage().contains(${serializeJavaValue(errorMessage)}));`)
      }
    } else {
      lines.push(`    assertEquals(${serializeJavaValue(test.expected)}, solution.${methodName}(${argsLiteral}));`)
    }
    lines.push('  }')
    lines.push('')
  })

  lines.push('}')
  return lines.join('\n')
}

export function getGeneratedTestPath(baseDir, language, slug) {
  const dir = path.join(baseDir, language, slug)
  if (language === 'python') return path.join(dir, 'tests.py')
  if (language === 'java') return path.join(dir, `${toPascalCase(slug)}Test.java`)
  return path.join(dir, 'tests.js')
}
