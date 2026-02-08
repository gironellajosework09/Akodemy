// Test runner for Exercism and canonical cases.
import { executeCode } from './judge0.js'
import fs from 'fs/promises'
import path from 'path'
import { getTestFilePath, readTestFile, EXERCISM_BASE_DIR, normalizeToExercismSlug } from './exercismTestSync.js'

// Service logic for Test Runner.
function countTestsFromJestOutput(output) {
  const passMatch = output.match(/(\d+) pass(?:ed|ing)/i)
  const failMatch = output.match(/(\d+) fail(?:ed|ing)/i)
  
  const passed = passMatch ? parseInt(passMatch[1]) : 0
  const failed = failMatch ? parseInt(failMatch[1]) : 0
  
  return { passed, total: passed + failed }
}

function countTestsFromPytestOutput(output) {
  // Pytest emits several summary formats; handle common variants before falling back.
  const summaryMatch = output.match(/(\d+) passed(?:.*?(\d+) failed)?/i) ||
                       output.match(/(\d+) failed(?:.*?(\d+) passed)?/i)
  
  if (summaryMatch) {
    if (output.includes('passed') && output.includes('failed')) {
      const passedMatch = output.match(/(\d+) passed/i)
      const failedMatch = output.match(/(\d+) failed/i)
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0
      return { passed, total: passed + failed }
    } else if (output.includes('passed')) {
      const passedMatch = output.match(/(\d+) passed/i)
      return { passed: parseInt(passedMatch[1]), total: parseInt(passedMatch[1]) }
    } else if (output.includes('failed')) {
      const failedMatch = output.match(/(\d+) failed/i)
      return { passed: 0, total: parseInt(failedMatch[1]) }
    }
  }
  
  // Fallback: count assertion markers when no summary is found.
  const assertions = output.match(/(?:PASSED|FAILED|ok|FAIL)/g) || []
  const passed = assertions.filter(a => a === 'PASSED' || a === 'ok').length
  return { passed, total: assertions.length || 1 }
}

function extractTestCasesFromJsTest(testContent) {
  const testCases = []
  const testRegex = /(?:test|it)\s*\(\s*['"`]([^'"`]+)['"`]/g
  let match
  
  while ((match = testRegex.exec(testContent)) !== null) {
    testCases.push({ description: match[1] })
  }
  
  return testCases
}

function extractTestCasesFromPythonTest(testContent) {
  const testCases = []
  const testRegex = /def\s+(test_[a-zA-Z0-9_]+)/g
  let match
  
  while ((match = testRegex.exec(testContent)) !== null) {
    testCases.push({ description: match[1].replace(/_/g, ' ').replace('test ', '') })
  }
  
  return testCases
}

function wrapJavaScriptCode(userCode, testContent, slug) {
  // Inline a minimal Jest-like harness so tests can run in a single Judge0 execution.
  const fileName = slug.replace(/-/g, '')
  
  const cleanedUserCode = userCode
    .replace(/^export\s+/gm, '')
    .replace(/module\.exports\s*=\s*\{[^}]*\}/g, '')
    .replace(/export\s+default\s+/g, '')
  
  const modifiedTest = testContent
    .replace(/import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]/g, '')
    .replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\)/g, '')
    .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]/g, '')

  return `
// User code
${cleanedUserCode}

// Test code (modified for inline execution)
let __passed = 0;
let __failed = 0;
let __results = [];
let __beforeEach = [];
let __afterEach = [];

function beforeEach(fn) {
  if (typeof fn === 'function') __beforeEach.push(fn);
}

function afterEach(fn) {
  if (typeof fn === 'function') __afterEach.push(fn);
}

function runWithHooks(fn) {
  for (const hook of __beforeEach) {
    hook();
  }
  fn();
  for (const hook of __afterEach) {
    hook();
  }
}

function test(description, fn) {
  try {
    runWithHooks(fn);
    __passed++;
    __results.push({ description, passed: true });
  } catch (e) {
    __failed++;
    __results.push({ description, passed: false, error: e.message });
  }
}

function it(description, fn) {
  test(description, fn);
}

function xtest(description, fn) {
  // Run x-tests as normal tests so Exercism's disabled cases are still enforced.
  test(description, fn);
}

function xit(description, fn) {
  it(description, fn);
}

function describe(name, fn) {
  const prevBefore = __beforeEach;
  const prevAfter = __afterEach;
  __beforeEach = [...prevBefore];
  __afterEach = [...prevAfter];
  fn();
  __beforeEach = prevBefore;
  __afterEach = prevAfter;
}

function xdescribe(name, fn) {
  describe(name, fn);
}

test.skip = function skipTest() {}
it.skip = function skipIt() {}
describe.skip = function skipDescribe() {}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(\`Expected \${expected} but got \${actual}\`);
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    },
    toStrictEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    },
    toThrow(msg) {
      if (typeof actual !== 'function') throw new Error('Expected a function');
      try { 
        actual(); 
        throw new Error('Expected function to throw'); 
      } catch (e) { 
        if (!msg) return;
        if (typeof msg === 'string') {
          if (!e.message.includes(msg)) throw e;
          return;
        }
        if (msg instanceof RegExp) {
          if (!msg.test(e.message)) throw e;
          return;
        }
        if (typeof msg === 'function') {
          if (!(e instanceof msg)) throw e;
          return;
        }
      }
    },
    toBeTruthy() { if (!actual) throw new Error(\`Expected truthy but got \${actual}\`); },
    toBeFalsy() { if (actual) throw new Error(\`Expected falsy but got \${actual}\`); },
    toContain(item) { 
      if (!actual.includes(item)) throw new Error(\`Expected to contain \${item}\`); 
    },
    toMatch(pattern) {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      if (!regex.test(String(actual))) throw new Error(\`Expected \${actual} to match \${regex}\`);
    },
    toHaveLength(len) {
      if (actual.length !== len) throw new Error(\`Expected length \${len} but got \${actual.length}\`);
    },
    toBeGreaterThan(n) { if (actual <= n) throw new Error(\`Expected > \${n} but got \${actual}\`); },
    toBeLessThan(n) { if (actual >= n) throw new Error(\`Expected < \${n} but got \${actual}\`); },
    toBeCloseTo(n, precision = 2) {
      const diff = Math.abs(actual - n);
      if (diff > Math.pow(10, -precision) / 2) 
        throw new Error(\`Expected \${n} (±\${Math.pow(10, -precision)}) but got \${actual}\`);
    },
    toBeInstanceOf(cls) {
      if (!(actual instanceof cls)) throw new Error(\`Expected instance of \${cls.name}\`);
    },
    not: {
      toBe(expected) { if (actual === expected) throw new Error(\`Expected not \${expected}\`); },
      toEqual(expected) { 
        if (JSON.stringify(actual) === JSON.stringify(expected)) 
          throw new Error('Expected values to differ'); 
      },
      toThrow() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        try { actual(); } catch (e) { throw new Error('Expected function not to throw'); }
      }
    }
  };
}

// Run tests
${modifiedTest}

// Output results
console.log(JSON.stringify({ passed: __passed, total: __passed + __failed, results: __results }));
`
}

function wrapPythonCode(userCode, testContent, slug) {
  const moduleName = slug.replace(/-/g, '_')
  
  const targetModuleImportRegex = new RegExp(`from\\s+${moduleName}\\s+import\\s+[^\\n]+`, 'g')
  const targetModuleImportRegex2 = new RegExp(`import\\s+${moduleName}\\b`, 'g')
  const targetModuleImportRegexMultiline = new RegExp(`from\\s+${moduleName}\\s+import\\s*\\([^)]+\\)`, 'gs')
  const needsFileLike = /from\s+test_utils\s+import\s+FileLike/.test(testContent)
  
  // Strip imports/decorators and run a lightweight unittest-style runner inline.
  const cleanedTest = testContent
    .replace(targetModuleImportRegexMultiline, '')
    .replace(targetModuleImportRegex, '')
    .replace(targetModuleImportRegex2, '')
    .replace(/from\s+test_utils\s+import\s+FileLike/g, '')
    .replace(/@pytest\.mark\.parametrize\([^)]+\)/g, '')
    .replace(/@pytest\.mark\.\w+(\([^)]*\))?/g, '')
    .replace(/unittest\.skip\([^)]*\)/g, 'lambda x: x')
    .replace(/if\s+__name__\s*==\s*['"]__main__['"]:\s*(?:\r?\n[ \t]+.*)*/g, '')
    .replace(/if\s+__name__\s*==\s*['"]__main__['"]:\s*unittest\.main\([^)]*\)\s*/g, '')
    .replace(/^\s*unittest\.main\([^)]*\)\s*$/gm, '')
    .replace(/\bunittest\.main\([^)]*\)\s*/g, '')
    .replace(/try:[\s\S]*?except ImportError[\s\S]*?raise ImportError[\s\S]*?from None/g, '')
    .replace(/except ImportError as import_fail:[\s\S]*?from None/g, '')
    .replace(/self\.assertEqual/g, 'self._assertEqual')
    .replace(/self\.assertTrue/g, 'self._assertTrue')
    .replace(/self\.assertFalse/g, 'self._assertFalse')
    .replace(/self\.assertRaises/g, 'self._assertRaises')
    .replace(/self\.assertIn/g, 'self._assertIn')
    .replace(/self\.assertAlmostEqual/g, 'self._assertAlmostEqual')
    .replace(/self\.assertIs\b/g, 'self._assertIs')
    .replace(/self\.assertIsNot\b/g, 'self._assertIsNot')
    .replace(/self\.assertIsNone\b/g, 'self._assertIsNone')
    .replace(/self\.assertIsNotNone\b/g, 'self._assertIsNotNone')
    .replace(/import\s+unittest\b/g, '')

  return `
import json
import sys

# User code
${userCode}

# Test results tracking
_test_results = {"passed": 0, "failed": 0, "results": []}

class TestCase:
    def _assertEqual(self, a, b, msg=None):
        if a != b:
            raise AssertionError(msg or f"Expected {b}, got {a}")

    def assertNotEqual(self, a, b, msg=None):
        if a == b:
            raise AssertionError(msg or f"Expected {a} != {b}")

    def assertRegex(self, text, regex, msg=None):
        import re
        if re.search(regex, text) is None:
            raise AssertionError(msg or f"Regex didn't match: {regex!r} not found in {text!r}")

    def assertRegexpMatches(self, text, regex, msg=None):
        return self.assertRegex(text, regex, msg)
    
    def _assertTrue(self, x, msg=None):
        if not x:
            raise AssertionError(msg or f"Expected True, got {x}")
    
    def _assertFalse(self, x, msg=None):
        if x:
            raise AssertionError(msg or f"Expected False, got {x}")
    
    def _assertRaises(self, exc, fn=None, *args, **kwargs):
        if fn is None:
            class RaisesContext:
                def __enter__(self): return self
                def __exit__(self, exc_type, exc_val, tb):
                    if exc_type is None:
                        raise AssertionError(f"Expected {exc.__name__} to be raised")
                    return issubclass(exc_type, exc)
            return RaisesContext()
        try:
            fn(*args, **kwargs)
            raise AssertionError(f"Expected {exc.__name__} to be raised")
        except exc:
            pass
    
    def _assertIn(self, a, b, msg=None):
        if a not in b:
            raise AssertionError(msg or f"{a} not in {b}")
    
    def _assertAlmostEqual(self, a, b, places=7, msg=None):
        if round(abs(a - b), places) != 0:
            raise AssertionError(msg or f"{a} != {b} within {places} places")
    
    def _assertIs(self, a, b, msg=None):
        if a is not b:
            raise AssertionError(msg or f"{a} is not {b}")
    
    def _assertIsNot(self, a, b, msg=None):
        if a is b:
            raise AssertionError(msg or f"{a} is {b}")
    
    def _assertIsNone(self, x, msg=None):
        if x is not None:
            raise AssertionError(msg or f"{x} is not None")
    
def _assertIsNotNone(self, x, msg=None):
    if x is None:
        raise AssertionError(msg or "Value is None")

# Alias common starter function names to match Exercism test expectations.
_alias_map = {}
if '${moduleName}' == 'hello_world':
    _alias_map['hello'] = 'hello_world'
elif '${moduleName}' == 'leap':
    _alias_map['leap_year'] = 'is_leap'
elif '${moduleName}' == 'reverse_string':
    _alias_map['reverse'] = 'reverse_string'
elif '${moduleName}' == 'hamming':
    _alias_map['distance'] = 'hamming'
elif '${moduleName}' == 'binary_search':
    _alias_map['find'] = 'binary_search'
elif '${moduleName}' == 'roman_numerals':
    _alias_map['roman'] = 'to_roman'

for _target, _source in _alias_map.items():
    if _source in globals() and _target not in globals():
        globals()[_target] = globals()[_source]

if '${moduleName}' == 'triangle' and 'triangle_type' in globals():
    def _triangle_equilateral(sides):
        return triangle_type(*sides) == "equilateral"

    def _triangle_isosceles(sides):
        return triangle_type(*sides) in ("isosceles", "equilateral")

    def _triangle_scalene(sides):
        return triangle_type(*sides) == "scalene"

    if 'equilateral' not in globals():
        equilateral = _triangle_equilateral
    if 'isosceles' not in globals():
        isosceles = _triangle_isosceles
    if 'scalene' not in globals():
        scalene = _triangle_scalene

# Modified test class that inherits from our TestCase
class unittest:
    TestCase = TestCase

${needsFileLike ? `
class FileLike:
    def __init__(self, fail_something=False):
        self.fail_something = fail_something
        self.is_open = False
        self.was_open = False
        self.did_something = False

    def open(self):
        self.is_open = True
        self.was_open = True
        return self

    def close(self):
        self.is_open = False

    def do_something(self):
        self.did_something = True
        if self.fail_something:
            raise Exception("Failed to do something")

    def __enter__(self):
        return self.open()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        return False
` : ''}

${cleanedTest}

# Find and run test classes
import inspect as _inspect

for _name, _obj in list(globals().items()):
    if _inspect.isclass(_obj) and _name.endswith('Test') and _name != 'TestCase':
        try:
            _instance = _obj()
            for _method_name in dir(_instance):
                if _method_name.startswith('test_'):
                    _method = getattr(_instance, _method_name)
                    if callable(_method):
                        try:
                            _method()
                            _test_results["passed"] += 1
                            _test_results["results"].append({"description": _method_name, "passed": True})
                        except Exception as _e:
                            _test_results["failed"] += 1
                            _test_results["results"].append({"description": _method_name, "passed": False, "error": str(_e)})
        except Exception as _e:
            _test_results["failed"] += 1
            _test_results["results"].append({"description": _name, "passed": False, "error": str(_e)})

_test_results["total"] = _test_results["passed"] + _test_results["failed"]
print(json.dumps(_test_results))
`
}

function cleanJsExports(code) {
  return code
    .replace(/^export\s+/gm, '')
    .replace(/module\.exports\s*=\s*\{[^}]*\}/g, '')
    .replace(/export\s+default\s+/g, '')
}

async function runTestsWithCanonicalData(userCode, language, testCases) {
  // Fallback path when no Exercism test file is usable.
  if (!testCases || testCases.length === 0) {
    return { passed: 0, total: 0, score: 0, results: [], error: 'No test cases available' }
  }

  const results = []
  let passed = 0

  for (const testCase of testCases) {
    try {
      let testCode = ''
      const input = testCase.input
      const expected = testCase.expected
      
      if (language === 'javascript') {
        const cleanedCode = cleanJsExports(userCode)
        const inputStr = JSON.stringify(input)
        
        const funcMatch = cleanedCode.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|async))/);
        const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : null;
        
        testCode = `${cleanedCode}

// Find and run the function
let testFunc = null;

if (typeof ${funcName || 'undefined'} === 'function') {
  testFunc = ${funcName || 'null'};
}

if (testFunc) {
  const inputVal = ${inputStr};
  // Handle different input formats: object with named args, array, or single value
  let result;
  if (inputVal && typeof inputVal === 'object' && !Array.isArray(inputVal)) {
    // Object input - get values in order and spread them
    const args = Object.values(inputVal);
    result = testFunc(...args);
  } else if (Array.isArray(inputVal)) {
    result = testFunc(...inputVal);
  } else {
    result = testFunc(inputVal);
  }
  console.log(JSON.stringify(result));
} else {
  console.log('NO_FUNCTION');
}`
      } else if (language === 'python') {
        const inputStr = JSON.stringify(input).replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False')
        const isObjectInput = input && typeof input === 'object' && !Array.isArray(input)
        
        testCode = `${userCode}

import json
import sys

# Find the main function
funcs = [v for k, v in globals().items() if callable(v) and not k.startswith('_') and k not in ['json', 'sys']]
input_val = ${inputStr}

if funcs:
    # Handle different input formats
    if isinstance(input_val, dict):
        def _camel_to_snake(name):
            import re
            s1 = re.sub('(.)([A-Z][a-z]+)', r'\\1_\\2', name)
            return re.sub('([a-z0-9])([A-Z])', r'\\1_\\2', s1).lower().replace('-', '_')

        snake_input = { _camel_to_snake(k): v for k, v in input_val.items() }
        try:
            result = funcs[0](**snake_input)
        except TypeError:
            result = funcs[0](*snake_input.values())
    elif isinstance(input_val, list):
        result = funcs[0](*input_val)
    else:
        result = funcs[0](input_val)
    print(json.dumps(result))
else:
    print('NO_FUNCTION')
`
      }

      const result = await executeCode(testCode, language)
      
      if (result.stdout) {
        try {
          const output = JSON.parse(result.stdout.trim())
          const isEqual = JSON.stringify(output) === JSON.stringify(expected)
          results.push({
            description: testCase.description,
            passed: isEqual,
            expected,
            actual: output
          })
          if (isEqual) passed++
        } catch (e) {
          results.push({
            description: testCase.description,
            passed: false,
            error: 'Could not parse output'
          })
        }
      } else {
        results.push({
          description: testCase.description,
          passed: false,
          error: result.stderr || result.compileOutput || 'No output'
        })
      }
    } catch (error) {
      results.push({
        description: testCase.description,
        passed: false,
        error: error.message
      })
    }
  }

  const total = testCases.length
  const score = total > 0 ? Math.round((passed / total) * 100) : 0

  return { passed, total, score, results }
}

async function runTests(userCode, language, challengeSlug, testCases = []) {
  const exerciseSlug = normalizeToExercismSlug(challengeSlug)
  
  const testFile = await readTestFile(language, exerciseSlug)
  
  if (!testFile) {
    // Prefer Exercism tests, but fall back to canonical data if missing.
    console.log(`No test file found for ${exerciseSlug}, falling back to canonical data`)
    return runTestsWithCanonicalData(userCode, language, testCases)
  }
  
  if (language === 'python' && testFile.content.includes('@pytest.mark.parametrize')) {
    console.log(`Pytest parametrization detected for ${exerciseSlug}, falling back to canonical data`)
    return runTestsWithCanonicalData(userCode, language, testCases)
  }
  
  let wrappedCode
  
  try {
    if (language === 'javascript') {
      wrappedCode = wrapJavaScriptCode(userCode, testFile.content, exerciseSlug)
    } else if (language === 'python') {
      wrappedCode = wrapPythonCode(userCode, testFile.content, exerciseSlug)
    } else if (language === 'java') {
      console.log('Java test execution not yet supported, falling back to canonical data')
      return runTestsWithCanonicalData(userCode, language, testCases)
    } else {
      return runTestsWithCanonicalData(userCode, language, testCases)
    }
    
    const result = await executeCode(wrappedCode, language)
    
    if (result.stderr && !result.stdout) {
      return {
        passed: 0,
        total: 1,
        score: 0,
        results: [{ description: 'Execution', passed: false, error: result.stderr }],
        error: result.stderr
      }
    }
    
    try {
      // Wrapped tests log a JSON payload on the last line.
      const output = result.stdout?.trim()
      const lastLine = output?.split('\n').pop()
      const testResults = JSON.parse(lastLine)
      
      const score = testResults.total > 0 
        ? Math.round((testResults.passed / testResults.total) * 100) 
        : 0
      
      return {
        passed: testResults.passed,
        total: testResults.total,
        score,
        results: testResults.results || []
      }
    } catch (parseError) {
      console.log('Could not parse test output, falling back to canonical data')
      return runTestsWithCanonicalData(userCode, language, testCases)
    }
    
  } catch (error) {
    console.error('Test execution error:', error)
    return runTestsWithCanonicalData(userCode, language, testCases)
  }
}

export {
  runTests,
  runTestsWithCanonicalData,
  extractTestCasesFromJsTest,
  extractTestCasesFromPythonTest
}



