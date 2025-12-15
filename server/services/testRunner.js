import { executeCode } from './judge0.js'
import fs from 'fs/promises'
import path from 'path'
import { getTestFilePath, readTestFile, EXERCISM_BASE_DIR, normalizeToExercismSlug } from './exercismTestSync.js'

function countTestsFromJestOutput(output) {
  const passMatch = output.match(/(\d+) pass(?:ed|ing)/i)
  const failMatch = output.match(/(\d+) fail(?:ed|ing)/i)
  
  const passed = passMatch ? parseInt(passMatch[1]) : 0
  const failed = failMatch ? parseInt(failMatch[1]) : 0
  
  return { passed, total: passed + failed }
}

function countTestsFromPytestOutput(output) {
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

function test(description, fn) {
  try {
    fn();
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

function describe(name, fn) {
  fn();
}

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
      try { actual(); throw new Error('Expected function to throw'); } 
      catch (e) { if (msg && !e.message.includes(msg)) throw e; }
    },
    toBeTruthy() { if (!actual) throw new Error(\`Expected truthy but got \${actual}\`); },
    toBeFalsy() { if (actual) throw new Error(\`Expected falsy but got \${actual}\`); },
    toContain(item) { 
      if (!actual.includes(item)) throw new Error(\`Expected to contain \${item}\`); 
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
  
  const cleanedTest = testContent
    .replace(targetModuleImportRegex, '')
    .replace(targetModuleImportRegex2, '')
    .replace(/@pytest\.mark\.parametrize\([^)]+\)/g, '')
    .replace(/@pytest\.mark\.\w+(\([^)]*\))?/g, '')
    .replace(/unittest\.skip\([^)]*\)/g, 'lambda x: x')
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

# Modified test class that inherits from our TestCase
class unittest:
    TestCase = TestCase

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

async function runTestsWithCanonicalData(userCode, language, testCases) {
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
        const inputStr = JSON.stringify(input)
        const expectedStr = JSON.stringify(expected)
        
        const funcMatch = userCode.match(/(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:function|\(|async))/);
        const funcName = funcMatch ? (funcMatch[1] || funcMatch[2]) : null;
        
        testCode = `${userCode}

// Find and run the function
const funcName = "${funcName}";
let testFunc = null;

if (typeof ${funcName || 'undefined'} === 'function') {
  testFunc = ${funcName || 'null'};
}

if (testFunc) {
  const inputVal = ${inputStr};
  const result = Array.isArray(inputVal) ? testFunc(...inputVal) : testFunc(inputVal);
  console.log(JSON.stringify(result));
} else {
  console.log('NO_FUNCTION');
}`
      } else if (language === 'python') {
        const inputStr = JSON.stringify(input).replace(/null/g, 'None').replace(/true/g, 'True').replace(/false/g, 'False')
        testCode = `${userCode}

import json
import sys

# Find the main function
funcs = [v for k, v in globals().items() if callable(v) and not k.startswith('_') and k != 'json']
if funcs:
    result = funcs[0](${typeof input === 'object' ? `*${inputStr}` : inputStr})
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
