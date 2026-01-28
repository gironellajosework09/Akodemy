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

def get_input_args(input_obj):
    if not input_obj:
        return [], {}
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
        args, kwargs = get_input_args(tc['input'])
        fn_name = camel_to_snake(tc.get('property', '${functionName}'))
        fn = globals().get(fn_name) or locals().get(fn_name)
        if not fn:
            raise Exception(f"Function {fn_name} not found")
        actual = fn(*args, **kwargs)
        expected = tc['expected']
        
        # Check if expected is an error object
        if isinstance(expected, dict) and 'error' in expected:
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
  
  const testCode = testCases.cases.map((tc, i) => {
    let methodArgs = ''
    let constructorArgs = ''
    if (tc.input && typeof tc.input === 'object' && !Array.isArray(tc.input)) {
      const ctor = tc.input.__constructorArgs || tc.input.constructorArgs
      const args = tc.input.__args || tc.input.args
      if (Array.isArray(ctor)) {
        constructorArgs = ctor.map(value => serializeJavaValue(value)).join(', ')
      }
      if (Array.isArray(args)) {
        methodArgs = args.map(value => serializeJavaValue(value)).join(', ')
      } else if (!ctor) {
        methodArgs = generateInputArgs(tc.input, 'java')
      }
    } else if (Array.isArray(tc.input)) {
      methodArgs = tc.input.map(value => serializeJavaValue(value)).join(', ')
    } else if (tc.input !== undefined && tc.input !== null) {
      methodArgs = serializeJavaValue(tc.input)
    }

    const ctorArray = constructorArgs && constructorArgs.trim().length > 0
      ? `new Object[]{${constructorArgs}}`
      : 'new Object[]{}'
    const argsArray = methodArgs && methodArgs.trim().length > 0
      ? `new Object[]{${methodArgs}}`
      : 'new Object[]{}'
    const desc = tc.description.replace(/"/g, "'").replace(/\\/g, "\\\\")
    // Use per-test property if available, otherwise use default
    const methodName = toCamelCase(tc.property || testCases.property || exerciseSlug)
    const unordered = tc.unordered ? 'true' : 'false'
    
    // Check if this test expects an error
    const expectsError = tc.expected && typeof tc.expected === 'object' && tc.expected.error
    
    if (expectsError) {
      // Test expects an exception to be thrown
      return `
            try {
                Object actual${i} = invoke("${methodName}", ${ctorArray}, ${argsArray});
                total++;
                // Expected error but got result
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":false,\\"expected\\":\\"error expected\\"},");
            } catch (Exception e) {
                passed++;
                total++;
                details.append("{\\"description\\":\\"${desc}\\",\\"passed\\":true,\\"expected\\":\\"error\\"},");
            }`
    } else {
      const expected = serializeJavaValue(tc.expected)
      const comparison = `deepEquals(expected${i}, actual${i})`
      
      return `
            try {
                Object expected${i} = ${expected};
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
            if (expectedList != null && actualList != null) return expectedList.equals(actualList);
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



