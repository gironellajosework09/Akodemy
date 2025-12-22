import { BaseRunner } from './baseRunner.js'
import { executeCode } from '../judge0.js'

export class PythonRunner extends BaseRunner {
  constructor(config = {}) {
    super(config)
    this.language = 'python'
  }

  cleanImports(testCode, slug) {
    const moduleName = slug.replace(/-/g, '_')
    
    let cleaned = testCode
    
    const classMatch = cleaned.match(/^class\s+\w+.*?:/m)
    if (classMatch) {
      const classIndex = cleaned.indexOf(classMatch[0])
      const beforeClass = cleaned.substring(0, classIndex)
      const afterClass = cleaned.substring(classIndex)
      
      const cleanedBeforeClass = beforeClass
        .replace(/try:[\s\S]*?(?=class\s|$)/g, '')
        .replace(/except[\s\S]*?(?=class\s|$)/g, '')
      
      cleaned = cleanedBeforeClass + afterClass
    }
    
    cleaned = cleaned
      .replace(new RegExp(`from\\s+${moduleName}\\s+import\\s+\\([^)]+\\)`, 'gs'), '')
      .replace(new RegExp(`from\\s+${moduleName}\\s+import\\s+[^\\n]+`, 'g'), '')
      .replace(new RegExp(`import\\s+${moduleName}\\b`, 'g'), '')
      .replace(/import\s+unittest\b/g, '')
      .replace(/import\s+pytest\b/g, '')
      .replace(/@pytest\.mark\.parametrize\([^)]+\)/gs, '')
      .replace(/@pytest\.mark\.\w+(\([^)]*\))?/g, '')
      .replace(/unittest\.skip\([^)]*\)/g, 'lambda x: x')
    
    cleaned = cleaned.replace(/^#.*$/gm, '')
    
    cleaned = cleaned.replace(/^\s*\n/gm, '\n')
    
    return cleaned.trim()
  }

  async prepare(userCode, testCode, slug) {
    const sanitizedCode = this.sanitizeCode(userCode)
    const cleanedTestCode = this.cleanImports(testCode, slug)

    return `
import json
import sys
import traceback

# === TEST FRAMEWORK ===
_test_results = {"passed": 0, "failed": 0, "total": 0, "errors": [], "details": []}

class TestCase:
    def assertEqual(self, a, b, msg=None):
        if a != b:
            raise AssertionError(msg or f"Expected {b}, got {a}")
    
    def assertTrue(self, x, msg=None):
        if not x:
            raise AssertionError(msg or f"Expected True, got {x}")
    
    def assertFalse(self, x, msg=None):
        if x:
            raise AssertionError(msg or f"Expected False, got {x}")
    
    def assertIsNone(self, x, msg=None):
        if x is not None:
            raise AssertionError(msg or f"Expected None, got {x}")
    
    def assertIsNotNone(self, x, msg=None):
        if x is None:
            raise AssertionError(msg or "Expected not None")
    
    def assertIn(self, a, b, msg=None):
        if a not in b:
            raise AssertionError(msg or f"{a} not in {b}")
    
    def assertNotIn(self, a, b, msg=None):
        if a in b:
            raise AssertionError(msg or f"{a} in {b}")
    
    def assertAlmostEqual(self, a, b, places=7, msg=None):
        if round(abs(a - b), places) != 0:
            raise AssertionError(msg or f"{a} != {b} within {places} places")
    
    def assertGreater(self, a, b, msg=None):
        if not a > b:
            raise AssertionError(msg or f"{a} not > {b}")
    
    def assertLess(self, a, b, msg=None):
        if not a < b:
            raise AssertionError(msg or f"{a} not < {b}")
    
    def assertRaises(self, exc, fn=None, *args, **kwargs):
        if fn is None:
            class RaisesContext:
                exception = None
                def __enter__(self): return self
                def __exit__(self, exc_type, exc_val, tb):
                    if exc_type is None:
                        raise AssertionError(f"Expected {exc.__name__} to be raised")
                    self.exception = exc_val
                    return issubclass(exc_type, exc)
            return RaisesContext()
        try:
            fn(*args, **kwargs)
            raise AssertionError(f"Expected {exc.__name__} to be raised")
        except exc:
            pass
    
    def assertRaisesWithMessage(self, exc, msg, fn, *args, **kwargs):
        try:
            fn(*args, **kwargs)
            raise AssertionError(f"Expected {exc.__name__} to be raised")
        except exc as e:
            if msg not in str(e):
                raise AssertionError(f"Expected message '{msg}' in '{str(e)}'")

class unittest:
    TestCase = TestCase

# === USER CODE ===
${sanitizedCode}

# === TEST CODE ===
${cleanedTestCode}

# === RUN TESTS ===
import inspect as _inspect

for _name, _obj in list(globals().items()):
    if _inspect.isclass(_obj) and _name.endswith('Test') and _name != 'TestCase':
        try:
            _instance = _obj()
            for _method_name in sorted(dir(_instance)):
                if _method_name.startswith('test_'):
                    _method = getattr(_instance, _method_name)
                    if callable(_method):
                        _test_results["total"] += 1
                        try:
                            _method()
                            _test_results["passed"] += 1
                            _test_results["details"].append({"name": _method_name, "passed": True})
                        except Exception as _e:
                            _test_results["failed"] += 1
                            _err_msg = str(_e)
                            _test_results["errors"].append({"test": _method_name, "error": _err_msg})
                            _test_results["details"].append({"name": _method_name, "passed": False, "error": _err_msg})
        except Exception as _e:
            _test_results["total"] += 1
            _test_results["failed"] += 1
            _test_results["errors"].append({"test": _name, "error": str(_e)})
            _test_results["details"].append({"name": _name, "passed": False, "error": str(_e)})

print('__TEST_RESULTS__' + json.dumps(_test_results))
`;
  }

  async execute(preparedCode) {
    return await executeCode(preparedCode, 'python')
  }

  parseResults(output) {
    const stdout = (output.stdout || '').trim()
    const stderr = output.stderr || ''
    
    const resultMatch = stdout.match(/__TEST_RESULTS__(.+)$/m)
    
    if (resultMatch) {
      try {
        const results = JSON.parse(resultMatch[1])
        return {
          totalTests: results.total,
          passedTests: results.passed,
          failedTests: results.failed,
          errors: results.errors,
          details: results.details,
          raw: { stdout, stderr }
        }
      } catch (e) {
        return this.createErrorResult(stderr || stdout, 'Failed to parse test results')
      }
    }
    
    if (stderr) {
      return this.createErrorResult(stderr)
    }
    
    return this.createErrorResult(stdout || 'No output received')
  }

  createErrorResult(error, message = null) {
    return {
      totalTests: 1,
      passedTests: 0,
      failedTests: 1,
      errors: [{ test: 'execution', error: message || error }],
      details: [{ name: 'execution', passed: false, error: message || error }],
      raw: { error }
    }
  }
}
