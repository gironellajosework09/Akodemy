// Python runner for executing tests.
import { BaseRunner } from './baseRunner.js'
import { executeCode } from '../judge0.js'

// Service logic for Python Runner.
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
      .replace(/import\s+pytest\b/g, '')
      .replace(/@pytest\.mark\.parametrize\([^)]+\)/gs, '')
      .replace(/@pytest\.mark\.\w+(\([^)]*\))?/g, '')
      .replace(/unittest\.skip\([^)]*\)/g, 'lambda x: x')
      .replace(/if\s+__name__\s*==\s*['"]__main__['"]:\s*(?:\r?\n[ \t]+.*)*/g, '')
      .replace(/if\s+__name__\s*==\s*['"]__main__['"]:\s*unittest\.main\([^)]*\)\s*/g, '')
      .replace(/^\s*unittest\.main\([^)]*\)\s*$/gm, '')
      .replace(/\bunittest\.main\([^)]*\)\s*/g, '')
    
    cleaned = cleaned.replace(/^#.*$/gm, '')
    
    cleaned = cleaned.replace(/^\s*\n/gm, '\n')
    
    return cleaned.trim()
  }

  async prepare(userCode, testCode, slug) {
    const sanitizedCode = this.sanitizeCode(userCode)
    const cleanedTestCode = this.cleanImports(testCode, slug)
    const moduleName = slug.replace(/-/g, '_')
    const quotedStudentCode = JSON.stringify(sanitizedCode)
    const quotedTestCode = JSON.stringify(cleanedTestCode)

    return `
import json
import sys
import traceback
import types
import unittest as ut

# === TEST FRAMEWORK ===
_test_results = {"passed": 0, "failed": 0, "total": 0, "errors": [], "details": []}

# Provide a helper if tests expect it.
if not hasattr(ut.TestCase, "assertRaisesWithMessage"):
    def _assertRaisesWithMessage(self, exc, msg, fn, *args, **kwargs):
        try:
            fn(*args, **kwargs)
            raise AssertionError(f"Expected {exc.__name__} to be raised")
        except exc as e:
            if msg not in str(e):
                raise AssertionError(f"Expected message '{msg}' in '{str(e)}'")
    ut.TestCase.assertRaisesWithMessage = _assertRaisesWithMessage

# Backwards-compat for older Exercism tests on newer Python.
if not hasattr(ut.TestCase, "assertRegexpMatches"):
    if hasattr(ut.TestCase, "assertRegex"):
        ut.TestCase.assertRegexpMatches = ut.TestCase.assertRegex
    else:
        import re
        def _assertRegexpMatches(self, text, regex, msg=None):
            if re.search(regex, text) is None:
                standard_msg = f"Regex didn't match: {regex!r} not found in {text!r}"
                raise AssertionError(msg or standard_msg)
        ut.TestCase.assertRegexpMatches = _assertRegexpMatches

if not hasattr(ut.TestCase, "assertRaisesRegexp") and hasattr(ut.TestCase, "assertRaisesRegex"):
    ut.TestCase.assertRaisesRegexp = ut.TestCase.assertRaisesRegex

# === USER CODE (isolated module) ===
_student_module = types.ModuleType("${moduleName}")
_student_module.__dict__["__name__"] = "${moduleName}"
_student_module.__dict__["__file__"] = "${moduleName}.py"
sys.modules["${moduleName}"] = _student_module
exec(${quotedStudentCode}, _student_module.__dict__)

# === TEST CODE (isolated module) ===
_test_module = types.ModuleType("${moduleName}_tests")
_test_module.__dict__["__name__"] = "${moduleName}_tests"
_test_module.__dict__["__file__"] = "${moduleName}_test.py"
exec(${quotedTestCode}, _test_module.__dict__)

# === RUN TESTS ===
_suite = ut.defaultTestLoader.loadTestsFromModule(_test_module)
_runner = ut.TextTestRunner(verbosity=2)
_result = _runner.run(_suite)

_test_results["total"] = _result.testsRun
_test_results["failed"] = len(_result.failures) + len(_result.errors)
_test_results["passed"] = _test_results["total"] - _test_results["failed"]

for _test, _err in _result.failures + _result.errors:
    _name = _test.id() if hasattr(_test, "id") else str(_test)
    _test_results["errors"].append({"test": _name, "error": _err})
    _test_results["details"].append({"name": _name, "passed": False, "error": _err})

print('__TEST_RESULTS__' + json.dumps(_test_results))
sys.exit(0 if _result.wasSuccessful() else 1)
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



