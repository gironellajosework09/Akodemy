function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function toSnakeCase(str) {
  return str.replace(/-/g, '_')
}

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, (_, c) => '_' + c.toLowerCase())
}

function toPascalCase(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

function serializeValue(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return JSON.stringify(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function serializeJavaValue(value) {
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return String(value) + (String(value).includes('.') ? '' : '.0')
  }
  if (typeof value === 'boolean') return `Boolean.valueOf(${value})`
  if (Array.isArray(value)) {
    if (value.length === 0) return 'java.util.Collections.emptyList()'
    if (typeof value[0] === 'number') {
      return `java.util.Arrays.asList(${value.map(v => Number.isInteger(v) ? v : v + '.0').join(', ')})`
    }
    if (typeof value[0] === 'string') {
      return `java.util.Arrays.asList(${value.map(v => `"${v.replace(/"/g, '\\"')}"`).join(', ')})`
    }
    return `java.util.Arrays.asList(${value.map(v => serializeJavaValue(v)).join(', ')})`
  }
  return String(value)
}

function getJavaType(value) {
  if (value === null) return 'Object'
  if (typeof value === 'string') return 'String'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return 'int'
    return 'double'
  }
  if (typeof value === 'boolean') return 'boolean'
  if (Array.isArray(value)) return 'Object'
  return 'Object'
}

function generateInputArgs(input, language) {
  const keys = Object.keys(input)
  if (keys.length === 0) return ''
  
  if (language === 'java') {
    return keys.map(k => serializeJavaValue(input[k])).join(', ')
  }
  
  return keys.map(k => serializeValue(input[k])).join(', ')
}

export function generateJavaScriptRunner(studentCode, testCases, exerciseSlug) {
  const functionName = toCamelCase(testCases.property || exerciseSlug)
  
  const casesJson = JSON.stringify(testCases.cases.map(c => ({
    description: c.description,
    input: c.input,
    expected: c.expected
  })))
  
  return `
// === STUDENT CODE ===
${studentCode.replace(/export\s+(const|function|class)/g, '$1')}

// === TEST HARNESS ===
const testCases = ${casesJson};

function deepEqual(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (!deepEqual(keysA, keysB)) return false;
  return keysA.every(k => deepEqual(a[k], b[k]));
}

function getInputArgs(input) {
  const keys = Object.keys(input);
  if (keys.length === 0) return [];
  return keys.map(k => input[k]);
}

let passed = 0;
const total = testCases.length;
const details = [];

for (const tc of testCases) {
  try {
    const args = getInputArgs(tc.input);
    const actual = ${functionName}(...args);
    const success = deepEqual(actual, tc.expected);
    if (success) passed++;
    details.push({
      description: tc.description,
      passed: success,
      expected: tc.expected,
      actual: success ? undefined : actual
    });
  } catch (error) {
    details.push({
      description: tc.description,
      passed: false,
      error: error.message
    });
  }
}

const score = total > 0 ? Math.round((passed / total) * 100) : 0;

console.log(JSON.stringify({ total, passed, score, details }));
`.trim()
}

export function generatePythonRunner(studentCode, testCases, exerciseSlug) {
  const rawProperty = testCases.property || exerciseSlug
  const functionName = camelToSnake(rawProperty).replace(/-/g, '_').replace(/^_/, '')
  
  const casesJson = JSON.stringify(testCases.cases.map(c => ({
    description: c.description,
    input: c.input,
    expected: c.expected
  })))
  
  return `
# === STUDENT CODE ===
${studentCode}

# === TEST HARNESS ===
import json

test_cases = json.loads('''${casesJson}''')

def deep_equal(a, b):
    if type(a) != type(b):
        if a is None and b is None:
            return True
        return False
    if isinstance(a, dict):
        if set(a.keys()) != set(b.keys()):
            return False
        return all(deep_equal(a[k], b[k]) for k in a)
    if isinstance(a, list):
        if len(a) != len(b):
            return False
        return all(deep_equal(x, y) for x, y in zip(a, b))
    return a == b

def get_input_args(input_obj):
    if not input_obj:
        return [], {}
    keys = list(input_obj.keys())
    return [input_obj[k] for k in keys], {}

passed = 0
total = len(test_cases)
details = []

for tc in test_cases:
    try:
        args, kwargs = get_input_args(tc['input'])
        actual = ${functionName}(*args, **kwargs)
        expected = tc['expected']
        success = deep_equal(actual, expected)
        if success:
            passed += 1
        details.append({
            'description': tc['description'],
            'passed': success,
            'expected': expected,
            'actual': None if success else actual
        })
    except Exception as e:
        details.append({
            'description': tc['description'],
            'passed': False,
            'error': str(e)
        })

score = round((passed / total) * 100) if total > 0 else 0

print(json.dumps({'total': total, 'passed': passed, 'score': score, 'details': details}))
`.trim()
}

export function generateJavaRunner(studentCode, testCases, exerciseSlug) {
  const className = toPascalCase(exerciseSlug)
  const methodName = toCamelCase(testCases.property || exerciseSlug)
  
  const modifiedStudentCode = studentCode.replace(/public\s+class/g, 'class')
  
  const testCode = testCases.cases.map((tc, i) => {
    const args = generateInputArgs(tc.input, 'java')
    const expected = serializeJavaValue(tc.expected)
    const javaType = getJavaType(tc.expected)
    
    const comparison = `java.util.Objects.equals(expected${i}, actual${i})`
    
    const desc = tc.description.replace(/"/g, "'").replace(/\\/g, "\\\\")
    
    return `
            try {
                Object expected${i} = ${expected};
                Object actual${i} = solution.${methodName}(${args});
                boolean success${i} = ${comparison};
                if (success${i}) passed++;
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":").append(success${i}).append("},");
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
  }).join('\n')
  
  return `
${modifiedStudentCode}

public class Main {
    public static void main(String[] args) {
        int passed = 0;
        int total = 0;
        StringBuilder details = new StringBuilder("[");
        
        ${className} solution = new ${className}();
        
        try {
${testCode}
        } catch (Exception e) {
            System.out.println("{\\"error\\": \\"" + (e.getMessage() != null ? e.getMessage() : "Unknown error") + "\\"}");
            return;
        }
        
        if (details.length() > 1) {
            details.setLength(details.length() - 1);
        }
        details.append("]");
        
        int score = total > 0 ? Math.round((float) passed / total * 100) : 0;
        
        System.out.println("{\\"total\\":" + total + ",\\"passed\\":" + passed + ",\\"score\\":" + score + ",\\"details\\":" + details + "}");
    }
}
`.trim()
}
