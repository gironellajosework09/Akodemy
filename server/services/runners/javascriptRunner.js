import { BaseRunner } from './baseRunner.js'
import { executeCode } from '../judge0.js'

export class JavaScriptRunner extends BaseRunner {
  constructor(config = {}) {
    super(config)
    this.language = 'javascript'
  }

  cleanExports(code) {
    return code
      .replace(/^export\s+/gm, '')
      .replace(/export\s+default\s+/g, '')
      .replace(/module\.exports\s*=\s*\{[^}]*\}/g, '')
      .replace(/module\.exports\s*=\s*\w+/g, '')
  }

  cleanImports(testCode) {
    return testCode
      .replace(/import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/import\s+\w+\s+from\s+['"][^'"]+['"]\s*;?/g, '')
      .replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\)\s*;?/g, '')
      .replace(/const\s+\w+\s*=\s*require\([^)]+\)\s*;?/g, '')
  }

  async prepare(userCode, testCode, slug) {
    const cleanedUserCode = this.sanitizeCode(this.cleanExports(userCode))
    const cleanedTestCode = this.cleanImports(testCode)

    return `
// === TEST FRAMEWORK ===
let __testResults = { passed: 0, failed: 0, total: 0, errors: [], details: [] };

function describe(name, fn) { fn(); }
function xdescribe(name, fn) { }
function beforeEach(fn) { }
function afterEach(fn) { }

function test(description, fn) {
  __testResults.total++;
  try {
    fn();
    __testResults.passed++;
    __testResults.details.push({ name: description, passed: true });
  } catch (e) {
    __testResults.failed++;
    __testResults.errors.push({ test: description, error: e.message });
    __testResults.details.push({ name: description, passed: false, error: e.message });
  }
}

function it(description, fn) { test(description, fn); }
function xit(description, fn) { }
function xtest(description, fn) { }
function test_skip(description, fn) { }

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    },
    toEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    },
    toStrictEqual(expected) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) 
        throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(actual)}\`);
    },
    toBeTruthy() { if (!actual) throw new Error(\`Expected truthy but got \${actual}\`); },
    toBeFalsy() { if (actual) throw new Error(\`Expected falsy but got \${actual}\`); },
    toBeNull() { if (actual !== null) throw new Error(\`Expected null but got \${actual}\`); },
    toBeUndefined() { if (actual !== undefined) throw new Error(\`Expected undefined but got \${actual}\`); },
    toBeDefined() { if (actual === undefined) throw new Error(\`Expected defined value\`); },
    toContain(item) { 
      if (!actual.includes(item)) throw new Error(\`Expected to contain \${JSON.stringify(item)}\`); 
    },
    toHaveLength(len) {
      if (actual.length !== len) throw new Error(\`Expected length \${len} but got \${actual.length}\`);
    },
    toBeGreaterThan(n) { if (actual <= n) throw new Error(\`Expected > \${n} but got \${actual}\`); },
    toBeGreaterThanOrEqual(n) { if (actual < n) throw new Error(\`Expected >= \${n} but got \${actual}\`); },
    toBeLessThan(n) { if (actual >= n) throw new Error(\`Expected < \${n} but got \${actual}\`); },
    toBeLessThanOrEqual(n) { if (actual > n) throw new Error(\`Expected <= \${n} but got \${actual}\`); },
    toBeCloseTo(n, precision = 2) {
      const diff = Math.abs(actual - n);
      if (diff > Math.pow(10, -precision) / 2) 
        throw new Error(\`Expected \${n} (±\${Math.pow(10, -precision)}) but got \${actual}\`);
    },
    toBeInstanceOf(cls) {
      if (!(actual instanceof cls)) throw new Error(\`Expected instance of \${cls.name}\`);
    },
    toMatch(pattern) {
      if (!pattern.test(actual)) throw new Error(\`Expected to match \${pattern}\`);
    },
    toThrow(msg) {
      if (typeof actual !== 'function') throw new Error('Expected a function');
      try { actual(); throw new Error('Expected function to throw'); } 
      catch (e) { 
        if (e.message === 'Expected function to throw') throw e;
        if (msg && !e.message.includes(msg)) throw new Error(\`Expected throw message to contain "\${msg}"\`);
      }
    },
    not: {
      toBe(expected) { if (actual === expected) throw new Error(\`Expected not \${JSON.stringify(expected)}\`); },
      toEqual(expected) { 
        if (JSON.stringify(actual) === JSON.stringify(expected)) 
          throw new Error('Expected values to differ'); 
      },
      toBeNull() { if (actual === null) throw new Error('Expected not null'); },
      toBeUndefined() { if (actual === undefined) throw new Error('Expected not undefined'); },
      toThrow() {
        if (typeof actual !== 'function') throw new Error('Expected a function');
        try { actual(); } catch (e) { throw new Error('Expected function not to throw'); }
      },
      toContain(item) {
        if (actual.includes(item)) throw new Error(\`Expected not to contain \${JSON.stringify(item)}\`);
      }
    }
  };
}

// === USER CODE ===
${cleanedUserCode}

// === TEST CODE ===
${cleanedTestCode}

// === OUTPUT RESULTS ===
console.log('__TEST_RESULTS__' + JSON.stringify(__testResults));
`;
  }

  async execute(preparedCode) {
    return await executeCode(preparedCode, 'javascript')
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
