import { BaseRunner } from './baseRunner.js'
import { executeCode } from '../judge0.js'

export class JavaRunner extends BaseRunner {
  constructor(config = {}) {
    super(config)
    this.language = 'java'
  }

  getClassName(slug) {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
  }

  async prepare(userCode, testCode, slug) {
    const className = this.getClassName(slug)
    
    return `
import java.util.*;
import java.lang.reflect.*;

// === USER CODE ===
${userCode}

// === SIMPLE TEST FRAMEWORK ===
class TestResults {
    int passed = 0;
    int failed = 0;
    int total = 0;
    List<String> errors = new ArrayList<>();
    List<Map<String, Object>> details = new ArrayList<>();
    
    void addPass(String name) {
        passed++;
        total++;
        Map<String, Object> d = new HashMap<>();
        d.put("name", name);
        d.put("passed", true);
        details.add(d);
    }
    
    void addFail(String name, String error) {
        failed++;
        total++;
        errors.add(name + ": " + error);
        Map<String, Object> d = new HashMap<>();
        d.put("name", name);
        d.put("passed", false);
        d.put("error", error);
        details.add(d);
    }
    
    String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\\"passed\\":" + passed + ",");
        sb.append("\\"failed\\":" + failed + ",");
        sb.append("\\"total\\":" + total + ",");
        sb.append("\\"errors\\":[");
        for (int i = 0; i < errors.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\\"" + errors.get(i).replace("\\"", "\\\\\\"") + "\\"");
        }
        sb.append("],");
        sb.append("\\"details\\":[");
        for (int i = 0; i < details.size(); i++) {
            if (i > 0) sb.append(",");
            Map<String, Object> d = details.get(i);
            sb.append("{");
            sb.append("\\"name\\":\\"" + d.get("name") + "\\",");
            sb.append("\\"passed\\":" + d.get("passed"));
            if (d.containsKey("error")) {
                sb.append(",\\"error\\":\\"" + String.valueOf(d.get("error")).replace("\\"", "\\\\\\"") + "\\"");
            }
            sb.append("}");
        }
        sb.append("]}");
        return sb.toString();
    }
}

public class Main {
    static TestResults results = new TestResults();
    
    static void assertEquals(Object expected, Object actual, String testName) {
        if (expected == null && actual == null) {
            results.addPass(testName);
        } else if (expected != null && expected.equals(actual)) {
            results.addPass(testName);
        } else {
            results.addFail(testName, "Expected " + expected + " but got " + actual);
        }
    }
    
    static void assertTrue(boolean condition, String testName) {
        if (condition) {
            results.addPass(testName);
        } else {
            results.addFail(testName, "Expected true but got false");
        }
    }
    
    public static void main(String[] args) {
        try {
            runTests();
        } catch (Exception e) {
            results.addFail("main", e.getMessage());
        }
        System.out.println("__TEST_RESULTS__" + results.toJson());
    }
    
    static void runTests() {
        // Basic test - check if class exists
        try {
            Class<?> cls = Class.forName("${className}");
            results.addPass("class_exists");
        } catch (ClassNotFoundException e) {
            results.addFail("class_exists", "${className} class not found");
        }
    }
}
`;
  }

  async execute(preparedCode) {
    return await executeCode(preparedCode, 'java')
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
