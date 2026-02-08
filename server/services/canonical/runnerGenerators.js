// Generate language runners for canonical tests.
// Service logic for Runner Generators.
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

function extractJavaClassNames(code) {
  const names = new Set()
  const regex = /\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/g
  let match
  while ((match = regex.exec(code)) !== null) {
    names.add(match[1])
  }
  return Array.from(names)
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
  // Convert JS values into Java-friendly literals for generated runner code.
  if (value === null) return 'null'
  if (typeof value === 'string') return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      if (Math.abs(value) > 2147483647) return `${value}L`
      return String(value)
    }
    return String(value) + (String(value).includes('.') ? '' : '.0')
  }
  if (typeof value === 'boolean') return `Boolean.valueOf(${value})`
  if (Array.isArray(value)) {
    if (value.length === 0) return 'java.util.Collections.emptyList()'
    if (typeof value[0] === 'number') {
      return `java.util.Arrays.asList(${value.map(v => Number.isInteger(v) ? v : v + '.0').join(', ')})`
    }
    if (typeof value[0] === 'string') {
      return `java.util.Arrays.asList(${value.map(v => `"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(', ')})`
    }
    return `java.util.Arrays.asList(${value.map(v => serializeJavaValue(v)).join(', ')})`
  }
  if (typeof value === 'object') {
    // For complex objects like {error: "..."}, serialize as JSON string
    return `"${JSON.stringify(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return `"${String(value)}"`
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
  
  // Keep canonical input order; Java needs Java literal formatting.
  if (language === 'java') {
    return keys.map(k => serializeJavaValue(input[k])).join(', ')
  }
  
  return keys.map(k => serializeValue(input[k])).join(', ')
}

export function generateJavaScriptRunner(studentCode, testCases, exerciseSlug) {
  const defaultFunctionName = toCamelCase(testCases.property || exerciseSlug)
  
  // Include property in test cases for multi-property exercises
  const casesJson = JSON.stringify(testCases.cases.map(c => ({
    description: c.description,
    property: c.property || testCases.property || exerciseSlug,
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

function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

for (const tc of testCases) {
  try {
    const args = getInputArgs(tc.input);
    const fnName = toCamelCase(tc.property);
    const fn = eval(fnName);
    const actual = fn(...args);
    
    // Check if expected is an error object
    if (tc.expected && typeof tc.expected === 'object' && tc.expected.error) {
      details.push({
        description: tc.description,
        passed: false,
        expected: 'error: ' + tc.expected.error,
        actual: actual
      });
    } else {
      const success = deepEqual(actual, tc.expected);
      if (success) passed++;
      details.push({
        description: tc.description,
        passed: success,
        expected: tc.expected,
        actual: success ? undefined : actual
      });
    }
  } catch (error) {
    if (tc.expected && typeof tc.expected === 'object' && tc.expected.error) {
      passed++;
      details.push({
        description: tc.description,
        passed: true,
        expected: 'error: ' + tc.expected.error
      });
    } else {
      details.push({
        description: tc.description,
        passed: false,
        expected: tc.expected,
        error: error.message
      });
    }
  }
}

const score = total > 0 ? Math.round((passed / total) * 100) : 0;

console.log(JSON.stringify({ total, passed, score, details }));
`.trim()
}

export function generatePythonRunner(studentCode, testCases, exerciseSlug) {
  const rawProperty = testCases.property || exerciseSlug
  const functionName = camelToSnake(rawProperty).replace(/-/g, '_').replace(/^_/, '')
  
  // Include property in test cases for multi-property exercises
  const casesJson = JSON.stringify(testCases.cases.map(c => ({
    description: c.description,
    property: c.property || testCases.property || exerciseSlug,
    input: c.input,
    expected: c.expected
  }))).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  
  return `
# === STUDENT CODE ===
${studentCode}

# === TEST HARNESS ===
import json

test_cases = json.loads('${casesJson}')
exercise_slug = '${exerciseSlug}'

def _normalize_slug(value):
    if value is None:
        return value
    slug = str(value).strip().lower().replace('_', '-')
    if slug.endswith('-python'):
        slug = slug[:-7]
    if slug.endswith('-py'):
        slug = slug[:-3]
    return slug

exercise_slug = _normalize_slug(exercise_slug)

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

def camel_to_snake(name):
    import re
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\\1_\\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\\1_\\2', s1).lower().replace('-', '_')

alias_map = {
    "hello-world": {"hello": "hello_world"},
    "leap": {"leap_year": "is_leap"},
    "reverse-string": {"reverse": "reverse_string"},
    "hamming": {"distance": "hamming"},
    "isogram": {"isogram": "is_isogram"},
    "pangram": {"pangram": "is_pangram"},
    "rna-transcription": {"rna_transcription": "to_rna"},
    "binary-search": {"find": "binary_search"},
    "roman-numerals": {"roman": "to_roman", "roman_numerals": "to_roman"},
    "anagram": {"anagram": "find_anagrams"},
    "run-length-encoding": {"run_length_encoding": "encode"},
    "sum-of-multiples": {"sum_multiples": "sum_of_multiples", "sum": "sum_of_multiples"},
    "sum-multiples": {"sum_multiples": "sum_of_multiples", "sum": "sum_of_multiples"},
    "triangle": {"triangle": "triangle_type", "equilateral": "triangle_type", "isosceles": "triangle_type", "scalene": "triangle_type"},
}

if exercise_slug == "triangle" and "triangle_type" in globals():
    def _triangle_equilateral(sides):
        return triangle_type(*sides) == "equilateral"

    def _triangle_isosceles(sides):
        return triangle_type(*sides) in ("isosceles", "equilateral")

    def _triangle_scalene(sides):
        return triangle_type(*sides) == "scalene"

    if "equilateral" not in globals():
        equilateral = _triangle_equilateral
    if "isosceles" not in globals():
        isosceles = _triangle_isosceles
    if "scalene" not in globals():
        scalene = _triangle_scalene

def get_input_args(input_obj):
    if input_obj is None:
        return [], {}
    if exercise_slug == "run-length-encoding" and isinstance(input_obj, dict):
        if "string" in input_obj and len(input_obj) == 1:
            return [input_obj["string"]], {}
    if exercise_slug == "binary-search" and isinstance(input_obj, dict):
        if "array" in input_obj and "value" in input_obj:
            return [input_obj["array"], input_obj["value"]], {}
    if exercise_slug == "flatten-array" and isinstance(input_obj, dict):
        if "array" in input_obj and len(input_obj) == 1:
            return [input_obj["array"]], {}
    if exercise_slug == "roman-numerals" and isinstance(input_obj, dict):
        if "number" in input_obj and len(input_obj) == 1:
            return [input_obj["number"]], {}
    if exercise_slug == "reverse-string" and isinstance(input_obj, dict):
        if "value" in input_obj and len(input_obj) == 1:
            return [input_obj["value"]], {}
    if exercise_slug == "isogram" and isinstance(input_obj, dict):
        if "phrase" in input_obj and len(input_obj) == 1:
            return [input_obj["phrase"]], {}
    if exercise_slug == "pangram" and isinstance(input_obj, dict):
        if "sentence" in input_obj and len(input_obj) == 1:
            return [input_obj["sentence"]], {}
    if exercise_slug == "triangle" and isinstance(input_obj, dict):
        if "sides" in input_obj:
            sides = input_obj["sides"]
            if isinstance(sides, list):
                if input_obj.get("_property") in ("equilateral", "isosceles", "scalene"):
                    return [sides], {}
                return sides, {}
    if exercise_slug in ("rna-transcription", "rna") and isinstance(input_obj, dict):
        if "strand" in input_obj and len(input_obj) == 1:
            return [input_obj["strand"]], {}
    if exercise_slug == "anagram" and isinstance(input_obj, dict):
        if "subject" in input_obj and "candidates" in input_obj:
            return [input_obj["subject"], input_obj["candidates"]], {}
    if exercise_slug in ("sum-of-multiples", "sum-multiples") and isinstance(input_obj, dict):
        if "limit" in input_obj and "factors" in input_obj:
            return [input_obj["limit"], input_obj["factors"]], {}
    # Allow positional args for non-dict inputs (strings, numbers, booleans).
    if isinstance(input_obj, list):
        return input_obj, {}
    if not isinstance(input_obj, dict):
        return [input_obj], {}
    # Convert camelCase keys to snake_case for Python functions
    snake_input = {}
    for k, v in input_obj.items():
        snake_key = camel_to_snake(k)
        snake_input[snake_key] = v
    # Pass as keyword arguments for Python functions
    return [], snake_input

passed = 0
total = len(test_cases)
details = []

for tc in test_cases:
    try:
        raw_input = tc['input']
        if exercise_slug == "triangle" and isinstance(raw_input, dict):
            raw_input = dict(raw_input)
            raw_input["_property"] = tc.get('property')
        args, kwargs = get_input_args(raw_input)
        fn_name = camel_to_snake(tc.get('property', '${functionName}'))
        if exercise_slug == "run-length-encoding" and fn_name == "consistency":
            if "encode" not in globals() or "decode" not in globals():
                missing = "encode" if "encode" not in globals() else "decode"
                raise Exception(f"Function {missing} not found")
            # Expect decode(encode(s)) == s
            s = kwargs.get('string') if kwargs else (args[0] if args else '')
            actual = decode(encode(s))
        else:
            fn = globals().get(fn_name) or locals().get(fn_name)
            if not fn:
                alt = alias_map.get(exercise_slug, {}).get(fn_name)
                if alt:
                    fn = globals().get(alt) or locals().get(alt)
            if not fn:
                raise Exception(f"Function {fn_name} not found")
            actual = fn(*args, **kwargs)
        expected = tc['expected']
        
        # Check if expected is an error object
        if isinstance(expected, dict) and 'error' in expected:
            # Accept -1 as a sentinel for "not found" in legacy platform tasks.
            if exercise_slug == "binary-search" and actual == -1:
                passed += 1
                details.append({
                    'description': tc['description'],
                    'passed': True,
                    'expected': 'error: ' + expected['error']
                })
            else:
                # Expected an error but didn't get one
                details.append({
                    'description': tc['description'],
                    'passed': False,
                    'expected': 'error: ' + expected['error'],
                    'actual': actual
                })
        else:
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
        expected = tc['expected']
        # Check if we expected an error
        if isinstance(expected, dict) and 'error' in expected:
            passed += 1
            details.append({
                'description': tc['description'],
                'passed': True,
                'expected': 'error: ' + expected['error']
            })
        else:
            details.append({
                'description': tc['description'],
                'passed': False,
                'expected': expected,
                'error': str(e)
            })

score = round((passed / total) * 100) if total > 0 else 0

print(json.dumps({'total': total, 'passed': passed, 'score': score, 'details': details}))
`.trim()
}

export function generateJavaRunner(studentCode, testCases, exerciseSlug) {
  const className = toPascalCase(exerciseSlug)
  const defaultMethodName = toCamelCase(testCases.property || exerciseSlug)
  const isBankAccount = exerciseSlug === 'bank-account'
  
  // Avoid duplicate Main class when we wrap with Main for execution.
  const renamedStudentCode = studentCode.replace(/\bclass\s+Main\b/g, 'class StudentMain')
  // Remove "public" to avoid multiple public classes when we wrap with Main.
  const modifiedStudentCode = renamedStudentCode.replace(/public\s+class/g, 'class')
  const detectedClasses = extractJavaClassNames(modifiedStudentCode)
  const classCandidates = Array.from(new Set([
    ...detectedClasses,
    className,
    'Main'
  ].filter(Boolean)))
  
  const renderBankAccountOp = (op, indent, caseIndex, counters) => {
    const pad = ' '.repeat(indent)
    if (!op || !op.operation) return ''
    const opName = op.operation
    if (opName === 'open') return `${pad}account.open();`
    if (opName === 'close') return `${pad}account.close();`
    if (opName === 'deposit') return `${pad}account.deposit(${op.amount});`
    if (opName === 'withdraw') return `${pad}account.withdraw(${op.amount});`
    if (opName === 'balance') return `${pad}lastBalance = account.getBalance(); hasBalance = true;`
    if (opName === 'concurrent') {
      const loopId = counters.next++
      const varName = `j${caseIndex}_${loopId}`
      const iterations = Number.isFinite(op.number) ? op.number : 0
      const innerOps = (op.operations || []).map(inner => renderBankAccountOp(inner, indent + 4, caseIndex, counters)).filter(Boolean).join('\n')
      return `${pad}for (int ${varName} = 0; ${varName} < ${iterations}; ${varName}++) {\n${innerOps}\n${pad}}`
    }
    return ''
  }

  const buildArgExpression = (value, prefix, idx) => {
    if (value && typeof value === 'object' && value.__invoke) {
      const inv = value.__invoke
      const ctorArgs = Array.isArray(inv.constructorArgs) ? inv.constructorArgs : []
      const methodArgs = Array.isArray(inv.methodArgs) ? inv.methodArgs : []
      let pre = ''
      const ctorExprs = ctorArgs.map((arg, cIdx) => {
        const built = buildArgExpression(arg, `${prefix}_c${cIdx}`, cIdx)
        pre += built.pre
        return built.expr
      })
      const argExprs = methodArgs.map((arg, aIdx) => {
        const built = buildArgExpression(arg, `${prefix}_a${aIdx}`, aIdx)
        pre += built.pre
        return built.expr
      })
      const varName = `${prefix}_v${idx}`
      const ctorArray = ctorExprs.length > 0 ? `new Object[]{${ctorExprs.join(', ')}}` : 'new Object[]{}'
      const argsArray = argExprs.length > 0 ? `new Object[]{${argExprs.join(', ')}}` : 'new Object[]{}'
      pre += `Object ${varName} = invoke("${inv.methodName}", ${ctorArray}, ${argsArray});\n`
      return { pre, expr: varName }
    }
    return { pre: '', expr: serializeJavaValue(value) }
  }

  const indentLines = (text, indent) => {
    if (!text) return ''
    return text
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => indent + line)
      .join('\n') + '\n'
  }

  const testCode = testCases.cases.map((tc, i) => {
    if (isBankAccount && tc.input && typeof tc.input === 'object' && tc.input.operations) {
      const counters = { next: 0 }
      const opsCode = tc.input.operations
        .map(op => renderBankAccountOp(op, 16, i, counters))
        .filter(Boolean)
        .join('\n')
      const desc = tc.description.replace(/"/g, "'").replace(/\\/g, "\\\\")
      const expectsError = tc.expected && typeof tc.expected === 'object' && tc.expected.error
      const expected = serializeJavaValue(tc.expected)

      if (expectsError) {
        return `
            try {
                BankAccount account = new BankAccount();
                int lastBalance = 0;
                boolean hasBalance = false;
                boolean threw = false;
                String errorMessage = null;
                try {
${opsCode}
                } catch (Exception e) {
                    threw = true;
                    errorMessage = e.getMessage();
                }
                total++;
                if (threw) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true,\\"expected\\":\\"error\\"},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"error\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      return `
            try {
                BankAccount account = new BankAccount();
                int lastBalance = 0;
                boolean hasBalance = false;
                boolean threw = false;
                String errorMessage = null;
                try {
${opsCode}
                } catch (Exception e) {
                    threw = true;
                    errorMessage = e.getMessage();
                }
                total++;
                if (threw) {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"")
                        .append(errorMessage != null ? errorMessage.replace("\\"", "'") : "error").append("\\"},");
                } else if (!hasBalance) {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"No balance operation\\"},");
                } else {
                    Object expected${i} = ${expected};
                    Object actual${i} = lastBalance;
                    boolean success${i} = deepEquals(expected${i}, actual${i});
                    if (success${i}) {
                        passed++;
                        details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                    } else {
                        String expectedStr${i} = escapeJson(expected${i});
                        String actualStr${i} = escapeJson(actual${i});
                        details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                            .append(expectedStr${i})
                            .append("\\",\\"actual\\":\\"")
                            .append(actualStr${i})
                            .append("\\"},");
                    }
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
    }
    let methodArgs = ''
    let constructorArgs = ''
    let argsPreamble = ''
    if (tc.input && typeof tc.input === 'object' && !Array.isArray(tc.input)) {
      const ctor = tc.input.__constructorArgs || tc.input.constructorArgs
      const args = tc.input.__args || tc.input.args
      if (Array.isArray(ctor)) {
        constructorArgs = ctor.map(value => serializeJavaValue(value)).join(', ')
      }
      if (Array.isArray(args)) {
        const builtArgs = args.map((value, idx) => buildArgExpression(value, `arg${i}_${idx}`, idx))
        const preamble = builtArgs.map(b => b.pre).join('')
        const exprs = builtArgs.map(b => b.expr)
        methodArgs = exprs.join(', ')
        argsPreamble = preamble
      } else if (!ctor) {
        methodArgs = generateInputArgs(tc.input, 'java')
      }
    } else if (Array.isArray(tc.input)) {
      const builtArgs = tc.input.map((value, idx) => buildArgExpression(value, `arg${i}_${idx}`, idx))
      const preamble = builtArgs.map(b => b.pre).join('')
      const exprs = builtArgs.map(b => b.expr)
      methodArgs = exprs.join(', ')
      argsPreamble = preamble
    } else if (tc.input !== undefined && tc.input !== null) {
      methodArgs = serializeJavaValue(tc.input)
    }

    if (exerciseSlug === 'anagram' && tc.input && typeof tc.input === 'object' && !Array.isArray(tc.input)) {
      if (Object.prototype.hasOwnProperty.call(tc.input, 'subject')) {
        constructorArgs = serializeJavaValue(tc.input.subject)
      }
      if (Object.prototype.hasOwnProperty.call(tc.input, 'candidates')) {
        methodArgs = serializeJavaValue(tc.input.candidates)
      }
    }
    if (exerciseSlug === 'anagram' && Array.isArray(tc.input)) {
      if (tc.input.length > 0) {
        constructorArgs = serializeJavaValue(tc.input[0])
      }
      if (tc.input.length > 1) {
        methodArgs = serializeJavaValue(tc.input[1])
      }
    }

    const ctorArray = constructorArgs && constructorArgs.trim().length > 0
      ? `new Object[]{${constructorArgs}}`
      : 'new Object[]{}'
    const argsArray = methodArgs && methodArgs.trim().length > 0
      ? `new Object[]{${methodArgs}}`
      : 'new Object[]{}'
    const desc = tc.description.replace(/"/g, "'").replace(/\\/g, "\\\\")
    // Use per-test property if available, otherwise use default
    const methodName = exerciseSlug === 'anagram'
      ? 'match'
      : toCamelCase(tc.property || testCases.property || exerciseSlug)
    const unordered = tc.unordered ? 'true' : 'false'
    
    const argsPreambleIndented = indentLines(argsPreamble, '                ')

    // Check if this test expects an error
    const expectsError = tc.expected && typeof tc.expected === 'object' && tc.expected.error
    const expectedInvocation = tc.expected && typeof tc.expected === 'object' && tc.expected.__invoke
    const expectedRegex = tc.expected && typeof tc.expected === 'object' && tc.expected.__regex
    const expectedEmpty = tc.expected && typeof tc.expected === 'object' && tc.expected.__empty
    const expectedNotEqual = tc.expected && typeof tc.expected === 'object' && tc.expected.__notEqual !== undefined
    const expectedNotEqualInvoke = tc.expected && typeof tc.expected === 'object' && tc.expected.__notEqualInvoke
    const expectedSize = tc.expected && typeof tc.expected === 'object' && tc.expected.__size !== undefined
    
    if (expectsError) {
      // Test expects an exception to be thrown
      return `
            try {
${argsPreambleIndented}                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                total++;
                // Expected error but got result
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"error expected\\"},");
            } catch (Exception e) {
                passed++;
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true,\\"expected\\":\\"error\\"},");
            }`
    } else {
      const comparison = `deepEquals(expected${i}, actual${i})`

      if (expectedInvocation) {
        const expCtorArgs = Array.isArray(expectedInvocation.constructorArgs)
          ? expectedInvocation.constructorArgs.map(value => serializeJavaValue(value)).join(', ')
          : ''
        const expMethodArgs = Array.isArray(expectedInvocation.methodArgs)
          ? expectedInvocation.methodArgs.map(value => serializeJavaValue(value)).join(', ')
          : ''
        const expCtorArray = expCtorArgs && expCtorArgs.trim().length > 0
          ? `new Object[]{${expCtorArgs}}`
          : 'new Object[]{}'
        const expArgsArray = expMethodArgs && expMethodArgs.trim().length > 0
          ? `new Object[]{${expMethodArgs}}`
          : 'new Object[]{}'
        const expMethodName = expectedInvocation.methodName
        const sameInstance = Boolean(expectedInvocation.sameInstance)

        if (sameInstance) {
          return `
            try {
${argsPreambleIndented}                Object[] args${i} = ${argsArray};
                Object[] expectedArgs${i} = ${expArgsArray};
                Object instance${i} = createInstanceForMethod("${methodName}", ${ctorArray}, args${i}.length);
                Object actual${i} = invokeOnInstance(instance${i}, "${methodName}", args${i});
                Object expected${i} = invokeOnInstance(instance${i}, "${expMethodName}", expectedArgs${i});
                boolean success${i} = ${unordered} ? compareUnordered(expected${i}, actual${i}) : ${comparison};
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    String expectedStr${i} = escapeJson(expected${i});
                    String actualStr${i} = escapeJson(actual${i});
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                        .append(expectedStr${i})
                        .append("\\",\\"actual\\":\\"")
                        .append(actualStr${i})
                        .append("\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
        }

        return `
            try {
${argsPreambleIndented}                Object expected${i} = invoke("${expMethodName}", ${expCtorArray}, ${expArgsArray});
                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                boolean success${i} = ${unordered} ? compareUnordered(expected${i}, actual${i}) : ${comparison};
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    String expectedStr${i} = escapeJson(expected${i});
                    String actualStr${i} = escapeJson(actual${i});
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                        .append(expectedStr${i})
                        .append("\\",\\"actual\\":\\"")
                        .append(actualStr${i})
                        .append("\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      if (expectedRegex) {
        const pattern = serializeJavaValue(tc.expected.__regex)
        return `
            try {
${argsPreambleIndented}                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                boolean success${i} = matchesRegex(actual${i}, ${pattern});
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                        .append(${pattern})
                        .append("\\",\\"actual\\":\\"")
                        .append(escapeJson(actual${i}))
                        .append("\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      if (expectedEmpty) {
        return `
            try {
${argsPreambleIndented}                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                boolean success${i} = isEmptyObject(actual${i});
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"empty\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      if (expectedSize) {
        const sizeVal = serializeJavaValue(tc.expected.__size)
        return `
            try {
${argsPreambleIndented}                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                Integer size${i} = sizeOfObject(actual${i});
                boolean success${i} = size${i} != null && size${i} == ${sizeVal};
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                        .append(${sizeVal})
                        .append("\\",\\"actual\\":\\"")
                        .append(size${i} == null ? "null" : size${i})
                        .append("\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      if (expectedNotEqual) {
        const notExpected = serializeJavaValue(tc.expected.__notEqual)
        return `
            try {
                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                Object expected${i} = ${notExpected};
                boolean success${i} = !deepEquals(expected${i}, actual${i});
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"not equal\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      if (expectedNotEqualInvoke) {
        const expCtorArgs = Array.isArray(expectedNotEqualInvoke.constructorArgs)
          ? expectedNotEqualInvoke.constructorArgs.map(value => serializeJavaValue(value)).join(', ')
          : ''
        const expMethodArgs = Array.isArray(expectedNotEqualInvoke.methodArgs)
          ? expectedNotEqualInvoke.methodArgs.map(value => serializeJavaValue(value)).join(', ')
          : ''
        const expCtorArray = expCtorArgs && expCtorArgs.trim().length > 0
          ? `new Object[]{${expCtorArgs}}`
          : 'new Object[]{}'
        const expArgsArray = expMethodArgs && expMethodArgs.trim().length > 0
          ? `new Object[]{${expMethodArgs}}`
          : 'new Object[]{}'
        const expMethodName = expectedNotEqualInvoke.methodName
        const sameInstance = Boolean(expectedNotEqualInvoke.sameInstance)

        if (sameInstance) {
          return `
            try {
${argsPreambleIndented}                Object[] args${i} = ${argsArray};
                Object[] expectedArgs${i} = ${expArgsArray};
                Object instance${i} = createInstanceForMethod("${methodName}", ${ctorArray}, args${i}.length);
                Object actual${i} = invokeOnInstance(instance${i}, "${methodName}", args${i});
                if ("robot-name".equals("${exerciseSlug}") && "getName".equals("${methodName}") && "getName".equals("${expMethodName}")) {
                    invokeOnInstance(instance${i}, "reset", new Object[]{});
                }
                Object expected${i} = invokeOnInstance(instance${i}, "${expMethodName}", expectedArgs${i});
                boolean success${i} = !deepEquals(expected${i}, actual${i});
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"not equal\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
        }

        return `
            try {
${argsPreambleIndented}                Object expected${i} = invoke("${expMethodName}", ${expCtorArray}, ${expArgsArray});
                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                boolean success${i} = !deepEquals(expected${i}, actual${i});
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"not equal\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
      }

      const expected = serializeJavaValue(tc.expected)
      
      return `
            try {
${argsPreambleIndented}                Object expected${i} = ${expected};
                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                boolean success${i} = ${unordered} ? compareUnordered(expected${i}, actual${i}) : ${comparison};
                total++;
                if (success${i}) {
                    passed++;
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true},");
                } else {
                    String expectedStr${i} = escapeJson(expected${i});
                    String actualStr${i} = escapeJson(actual${i});
                    details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"")
                        .append(expectedStr${i})
                        .append("\\",\\"actual\\":\\"")
                        .append(actualStr${i})
                        .append("\\"},");
                }
            } catch (Exception e) {
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\"", "'") : "error").append("\\"},");
            }`
    }
  }).join('\n')
  
  return `
${modifiedStudentCode}

public class Main {
    private static final String[] CLASS_CANDIDATES = new String[] { ${classCandidates.map(name => `"${name}"`).join(', ')} };

    private static java.lang.reflect.Method findMethod(Class<?> cls, String name, int argCount) {
        for (java.lang.reflect.Method method : cls.getDeclaredMethods()) {
            if (method.getName().equals(name) && method.getParameterCount() == argCount) {
                method.setAccessible(true);
                return method;
            }
        }
        for (java.lang.reflect.Method method : cls.getMethods()) {
            if (method.getName().equals(name) && method.getParameterCount() == argCount) {
                method.setAccessible(true);
                return method;
            }
        }
        return null;
    }

    private static java.lang.reflect.Method findFallbackMethod(Class<?> cls, int argCount) {
        java.util.List<java.lang.reflect.Method> matches = new java.util.ArrayList<>();
        for (java.lang.reflect.Method method : cls.getDeclaredMethods()) {
            if (method.getParameterCount() != argCount) continue;
            if (method.getName().equals("main")) continue;
            matches.add(method);
        }
        if (matches.size() == 1) {
            java.lang.reflect.Method method = matches.get(0);
            method.setAccessible(true);
            return method;
        }
        return null;
    }

    private static Object convertArg(Object arg, Class<?> targetType) {
        if (arg == null) {
            if (targetType.isPrimitive()) {
                if (targetType == boolean.class) return false;
                if (targetType == char.class) return '\u0000';
                return 0;
            }
            return null;
        }

        if (targetType.isInstance(arg)) return arg;

        if (targetType.isPrimitive()) {
            if (targetType == int.class) return ((Number) arg).intValue();
            if (targetType == long.class) return ((Number) arg).longValue();
            if (targetType == double.class) return ((Number) arg).doubleValue();
            if (targetType == float.class) return ((Number) arg).floatValue();
            if (targetType == short.class) return ((Number) arg).shortValue();
            if (targetType == byte.class) return ((Number) arg).byteValue();
            if (targetType == boolean.class) return (Boolean) arg;
            if (targetType == char.class) return arg.toString().charAt(0);
        }

        if (targetType.isArray()) {
            Class<?> component = targetType.getComponentType();
            if (arg.getClass().isArray()) {
                int length = java.lang.reflect.Array.getLength(arg);
                Object newArray = java.lang.reflect.Array.newInstance(component, length);
                for (int i = 0; i < length; i++) {
                    Object value = java.lang.reflect.Array.get(arg, i);
                    java.lang.reflect.Array.set(newArray, i, convertArg(value, component));
                }
                return newArray;
            }
            if (arg instanceof java.util.List) {
                java.util.List<?> list = (java.util.List<?>) arg;
                Object newArray = java.lang.reflect.Array.newInstance(component, list.size());
                for (int i = 0; i < list.size(); i++) {
                    java.lang.reflect.Array.set(newArray, i, convertArg(list.get(i), component));
                }
                return newArray;
            }
        }

        if (java.util.List.class.isAssignableFrom(targetType)) {
            if (arg.getClass().isArray()) {
                return arrayToList(arg);
            }
            if (arg instanceof java.util.List) return arg;
        }

        return arg;
    }

    private static Object[] convertArgs(Class<?>[] types, Object[] args) {
        if (args == null) return new Object[0];
        Object[] converted = new Object[args.length];
        for (int i = 0; i < args.length; i++) {
            Class<?> target = i < types.length ? types[i] : Object.class;
            converted[i] = convertArg(args[i], target);
        }
        return converted;
    }

    private static Object createInstance(Class<?> cls, Object[] constructorArgs) throws Exception {
        if (constructorArgs == null || constructorArgs.length == 0) {
            return cls.getDeclaredConstructor().newInstance();
        }
        for (java.lang.reflect.Constructor<?> ctor : cls.getDeclaredConstructors()) {
            if (ctor.getParameterCount() != constructorArgs.length) continue;
            ctor.setAccessible(true);
            Object[] converted = convertArgs(ctor.getParameterTypes(), constructorArgs);
            return ctor.newInstance(converted);
        }
        throw new NoSuchMethodException("Constructor not found for " + cls.getName());
    }

    private static Object createInstanceForMethod(String methodName, Object[] constructorArgs, int argCount) throws Exception {
        for (String candidate : CLASS_CANDIDATES) {
            try {
                Class<?> cls = Class.forName(candidate);
                java.lang.reflect.Method method = findMethod(cls, methodName, argCount);
                if (method == null) {
                    method = findFallbackMethod(cls, argCount);
                }
                if (method != null) {
                    return createInstance(cls, constructorArgs);
                }
            } catch (ClassNotFoundException e) {
                // Continue searching other candidates.
            }
        }
        throw new NoSuchMethodException("Method not found: " + methodName);
    }

    private static Object invokeOnInstance(Object instance, String methodName, Object[] args) throws Exception {
        if (instance == null) {
            throw new IllegalArgumentException("Instance is null");
        }
        Class<?> cls = instance.getClass();
        java.lang.reflect.Method method = findMethod(cls, methodName, args.length);
        if (method == null) {
            method = findFallbackMethod(cls, args.length);
        }
        if (method == null) {
            throw new NoSuchMethodException("Method not found: " + methodName);
        }
        Object[] converted = convertArgs(method.getParameterTypes(), args);
        return method.invoke(instance, converted);
    }

    private static boolean matchesRegex(Object actual, String pattern) {
        if (actual == null) return false;
        return String.valueOf(actual).matches(pattern);
    }

    private static boolean isEmptyObject(Object actual) {
        if (actual == null) return true;
        if (actual instanceof java.util.Collection) return ((java.util.Collection<?>) actual).isEmpty();
        if (actual instanceof java.util.Map) return ((java.util.Map<?, ?>) actual).isEmpty();
        if (actual instanceof String) return ((String) actual).isEmpty();
        if (actual.getClass().isArray()) return java.lang.reflect.Array.getLength(actual) == 0;
        return false;
    }

    private static Integer sizeOfObject(Object actual) {
        if (actual == null) return null;
        if (actual instanceof java.util.Collection) return ((java.util.Collection<?>) actual).size();
        if (actual instanceof java.util.Map) return ((java.util.Map<?, ?>) actual).size();
        if (actual instanceof String) return ((String) actual).length();
        if (actual.getClass().isArray()) return java.lang.reflect.Array.getLength(actual);
        return null;
    }

    private static Object invoke(String methodName, Object[] constructorArgs, Object[] args) throws Exception {
        java.lang.reflect.Method fallback = null;
        Object fallbackInstance = null;
        for (String candidate : CLASS_CANDIDATES) {
            try {
                Class<?> cls = Class.forName(candidate);
                if ("__constructor".equals(methodName)) {
                    createInstance(cls, constructorArgs);
                    return null;
                }
                java.lang.reflect.Method method = findMethod(cls, methodName, args.length);
                if (method != null) {
                    Object instance = java.lang.reflect.Modifier.isStatic(method.getModifiers())
                    ? null
                    : createInstance(cls, constructorArgs);
                    Object[] converted = convertArgs(method.getParameterTypes(), args);
                    return method.invoke(instance, converted);
                }

                if (fallback == null) {
                    java.lang.reflect.Method candidateFallback = findFallbackMethod(cls, args.length);
                    if (candidateFallback != null) {
                        fallback = candidateFallback;
                        fallbackInstance = java.lang.reflect.Modifier.isStatic(candidateFallback.getModifiers())
                            ? null
                            : createInstance(cls, constructorArgs);
                    }
                }
            } catch (ClassNotFoundException e) {
                // Continue searching other candidates.
            }
        }
        if (fallback != null) {
            Object[] converted = convertArgs(fallback.getParameterTypes(), args);
            return fallback.invoke(fallbackInstance, converted);
        }
        throw new NoSuchMethodException("Method not found: " + methodName);
    }

    private static java.util.List<Object> arrayToList(Object array) {
        if (array == null || !array.getClass().isArray()) return null;
        int length = java.lang.reflect.Array.getLength(array);
        java.util.List<Object> list = new java.util.ArrayList<>(length);
        for (int i = 0; i < length; i++) {
            list.add(java.lang.reflect.Array.get(array, i));
        }
        return list;
    }

    private static boolean deepEquals(Object expected, Object actual) {
        if (expected == actual) return true;
        if (expected == null || actual == null) return false;

        if (expected instanceof Number && actual instanceof Number) {
            double e = ((Number) expected).doubleValue();
            double a = ((Number) actual).doubleValue();
            return Double.compare(e, a) == 0;
        }

        if (expected.getClass().isArray() || actual.getClass().isArray()) {
            if (expected.getClass().isArray() && actual.getClass().isArray()) {
                if (expected instanceof Object[] && actual instanceof Object[]) {
                    return java.util.Arrays.deepEquals((Object[]) expected, (Object[]) actual);
                }
                if (expected instanceof int[] && actual instanceof int[]) return java.util.Arrays.equals((int[]) expected, (int[]) actual);
                if (expected instanceof long[] && actual instanceof long[]) return java.util.Arrays.equals((long[]) expected, (long[]) actual);
                if (expected instanceof double[] && actual instanceof double[]) return java.util.Arrays.equals((double[]) expected, (double[]) actual);
                if (expected instanceof float[] && actual instanceof float[]) return java.util.Arrays.equals((float[]) expected, (float[]) actual);
                if (expected instanceof short[] && actual instanceof short[]) return java.util.Arrays.equals((short[]) expected, (short[]) actual);
                if (expected instanceof byte[] && actual instanceof byte[]) return java.util.Arrays.equals((byte[]) expected, (byte[]) actual);
                if (expected instanceof char[] && actual instanceof char[]) return java.util.Arrays.equals((char[]) expected, (char[]) actual);
                if (expected instanceof boolean[] && actual instanceof boolean[]) return java.util.Arrays.equals((boolean[]) expected, (boolean[]) actual);
            }

            java.util.List<Object> expectedList = arrayToList(expected);
            java.util.List<Object> actualList = arrayToList(actual);
            if (expectedList != null && actualList != null) return expectedList.equals(actualList);
        }

        if (expected instanceof java.util.List || actual instanceof java.util.List) {
            java.util.List<?> expectedList = expected instanceof java.util.List ? (java.util.List<?>) expected : arrayToList(expected);
            java.util.List<?> actualList = actual instanceof java.util.List ? (java.util.List<?>) actual : arrayToList(actual);
            if (expectedList != null && actualList != null) {
                if (expectedList.size() != actualList.size()) return false;
                for (int i = 0; i < expectedList.size(); i++) {
                    if (!deepEquals(expectedList.get(i), actualList.get(i))) return false;
                }
                return true;
            }
        }

        return expected.equals(actual);
    }

    private static boolean compareUnordered(Object expected, Object actual) {
        java.util.List<Object> expectedList = expected instanceof java.util.List
            ? new java.util.ArrayList<>((java.util.List<?>) expected)
            : arrayToList(expected);
        java.util.List<Object> actualList = actual instanceof java.util.List
            ? new java.util.ArrayList<>((java.util.List<?>) actual)
            : arrayToList(actual);

        if (expectedList == null || actualList == null) return false;
        if (expectedList.size() != actualList.size()) return false;

        for (Object item : expectedList) {
            boolean removed = false;
            for (int i = 0; i < actualList.size(); i++) {
                if (deepEquals(item, actualList.get(i))) {
                    actualList.remove(i);
                    removed = true;
                    break;
                }
            }
            if (!removed) return false;
        }

        return actualList.isEmpty();
    }

    private static String escapeJson(Object value) {
        if (value == null) return "null";
        String str = String.valueOf(value);
        return str.replace("\\\\", "\\\\\\\\").replace("\\"", "'");
    }

    public static void main(String[] args) {
        int passed = 0;
        int total = 0;
        StringBuilder details = new StringBuilder("[");
        
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



