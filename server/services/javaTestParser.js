// Lightweight parser for simple JUnit/AssertJ-style Java tests.
// Converts assertions into canonical-style test cases.

function splitArgs(argStr) {
  const args = []
  let current = ''
  let inString = false
  let escape = false
  let parenDepth = 0

  for (let i = 0; i < argStr.length; i++) {
    const ch = argStr[i]
    if (escape) {
      current += ch
      escape = false
      continue
    }
    if (ch === '\\') {
      current += ch
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      current += ch
      continue
    }
    if (!inString && ch === '(') {
      parenDepth++
      current += ch
      continue
    }
    if (!inString && ch === ')' && parenDepth > 0) {
      parenDepth--
      current += ch
      continue
    }
    if (ch === ',' && !inString && parenDepth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }

  if (current.trim()) args.push(current.trim())
  return args
}

function unescapeJavaString(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}

function parseJavaLiteral(value) {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^[-]?\d+[lL]$/.test(trimmed)) return Number(trimmed.slice(0, -1))
  if (trimmed === 'null') return null
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (/^[-]?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed)
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return unescapeJavaString(trimmed.slice(1, -1))
  }
  return trimmed
}

function parseListExpression(expression, resolveValue) {
  const trimmed = expression.trim()
  const patterns = [
    { prefix: 'Arrays.asList(', suffix: ')' },
    { prefix: 'List.of(', suffix: ')' },
    { prefix: 'Collections.singletonList(', suffix: ')' }
  ]

  for (const pattern of patterns) {
    if (trimmed.startsWith(pattern.prefix) && trimmed.endsWith(pattern.suffix)) {
      const inner = trimmed.slice(pattern.prefix.length, trimmed.length - pattern.suffix.length)
      if (pattern.prefix.includes('singletonList')) {
        return [resolveValue(inner.trim())]
      }
      const values = splitArgs(inner).map(arg => resolveValue(arg))
      return values
    }
  }

  return null
}

function parseMethodCall(expression) {
  const trimmed = expression.trim()
  const endParen = trimmed.lastIndexOf(')')
  const startParen = trimmed.lastIndexOf('(')
  if (startParen === -1 || endParen === -1 || endParen < startParen) return null

  const rawArgs = trimmed.slice(startParen + 1, endParen).trim()
  let idx = startParen - 1
  while (idx >= 0 && /\s/.test(trimmed[idx])) idx--
  let end = idx
  while (idx >= 0 && /[A-Za-z0-9_]/.test(trimmed[idx])) idx--
  const methodName = trimmed.slice(idx + 1, end + 1)
  if (!methodName) return null

  if (!rawArgs) return { methodName, args: [] }
  const args = splitArgs(rawArgs).map(parseJavaLiteral)
  return { methodName, args }
}

export function extractJavaTestCases(testContent) {
  const lines = testContent.split(/\r?\n/)
  const cases = []
  let currentName = null
  let capture = null
  let captureException = null

  const globalValues = new Map()
  const globalInstances = new Map()
  let localValues = new Map()
  let localInstances = new Map()
  let localCalls = new Map()
  let currentMode = 'global'

  const normalizeWhitespace = (value) => {
    let out = ''
    let inString = false
    let escape = false
    let prevSpace = false
    for (let i = 0; i < value.length; i++) {
      const ch = value[i]
      if (escape) {
        out += ch
        escape = false
        prevSpace = false
        continue
      }
      if (ch === '\\') {
        out += ch
        escape = true
        prevSpace = false
        continue
      }
      if (ch === '"') {
        inString = !inString
        out += ch
        prevSpace = false
        continue
      }
      if (!inString && /\s/.test(ch)) {
        if (!prevSpace) {
          out += ' '
          prevSpace = true
        }
        continue
      }
      out += ch
      prevSpace = false
    }
    return out.trim()
  }

  const resolveValue = (token) => {
    const trimmed = token.trim()
    if (localValues.has(trimmed)) return localValues.get(trimmed)
    if (globalValues.has(trimmed)) return globalValues.get(trimmed)
    if (localCalls.has(trimmed)) {
      return { __invoke: localCalls.get(trimmed) }
    }
    const listValue = parseListExpression(trimmed, resolveValue)
    if (listValue !== null) return listValue
    return parseJavaLiteral(trimmed)
  }

  const parseConstructor = (expression) => {
    const match = expression.match(/new\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/)
    if (!match) return null
    const className = match[1]
    const rawArgs = match[2].trim()
    const ctorArgs = rawArgs ? splitArgs(rawArgs).map(arg => resolveValue(arg)) : []
    return { className, constructorArgs: ctorArgs }
  }

  const parseInvocation = (expression) => {
    const trimmed = expression.trim()
    if (trimmed.startsWith('new ')) {
      const chainMatch = trimmed.match(/new\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/)
      if (chainMatch) {
        const ctorArgs = chainMatch[2].trim()
        const methodArgs = chainMatch[4].trim()
        return {
          methodName: chainMatch[3],
          constructorArgs: ctorArgs ? splitArgs(ctorArgs).map(arg => resolveValue(arg)) : [],
          methodArgs: methodArgs ? splitArgs(methodArgs).map(arg => resolveValue(arg)) : []
        }
      }
      const ctorOnly = parseConstructor(trimmed)
      if (ctorOnly) {
        return {
          methodName: '__constructor',
          constructorArgs: ctorOnly.constructorArgs,
          methodArgs: []
        }
      }
    }

    const instanceMatch = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\.\s*([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/)
    if (instanceMatch) {
      const instanceName = instanceMatch[1]
      const methodName = instanceMatch[2]
      const rawArgs = instanceMatch[3].trim()
      const instanceInfo = localInstances.get(instanceName) || globalInstances.get(instanceName)
      return {
        methodName,
        instanceName,
        constructorArgs: instanceInfo?.constructorArgs || [],
        methodArgs: rawArgs ? splitArgs(rawArgs).map(arg => resolveValue(arg)) : []
      }
    }

    const directCall = parseMethodCall(trimmed)
    if (directCall) {
      return {
        methodName: directCall.methodName,
        instanceName: null,
        constructorArgs: [],
        methodArgs: directCall.args
      }
    }

    return null
  }

  const flushCapture = () => {
    if (!capture) return
    const normalized = normalizeWhitespace(capture)
    capture = null

    const assertMatch = normalized.match(
      /assertThat\s*\((.*?)\)\s*\.\s*(isEqualTo|isTrue|isFalse|containsExactly|containsExactlyInAnyOrder|matches|isEmpty|isNotEqualTo|hasSize)\s*(?:\((.*?)\))?\s*;/
    )
    if (!assertMatch) return

    const expr = assertMatch[1].trim()
    const assertion = assertMatch[2]
    const expectedRaw = assertMatch[3] ?? ''
    let invocation = parseInvocation(expr)

    if (!invocation && localCalls.has(expr)) invocation = localCalls.get(expr)
    if (!invocation && globalValues.has(expr)) return
    if (!invocation) return

    let expected
    let expectedInvocation = null
    if (assertion === 'isTrue') expected = true
    else if (assertion === 'isFalse') expected = false
    else if (assertion === 'isEmpty') expected = { __empty: true }
    else if (assertion === 'hasSize') {
      const trimmedExpected = (expectedRaw ?? '').trim()
      expected = { __size: resolveValue(trimmedExpected) }
    }
    else if (assertion === 'matches') {
      const trimmedExpected = (expectedRaw ?? '').trim()
      const resolved = resolveValue(trimmedExpected)
      const normalized = typeof resolved === 'string' ? resolved.replace(/\\\\/g, '\\') : resolved
      expected = { __regex: normalized }
    }
    else if (assertion === 'isNotEqualTo') {
      const trimmedExpected = (expectedRaw ?? '').trim()
      let expectedInv = parseInvocation(trimmedExpected)
      if (!expectedInv && localCalls.has(trimmedExpected)) expectedInv = localCalls.get(trimmedExpected)
      if (expectedInv) {
        expected = {
          __notEqualInvoke: {
            methodName: expectedInv.methodName,
            constructorArgs: expectedInv.constructorArgs || [],
            methodArgs: expectedInv.methodArgs || [],
            sameInstance: Boolean(
              expectedInv.instanceName &&
              invocation.instanceName &&
              expectedInv.instanceName === invocation.instanceName
            )
          }
        }
      } else {
        expected = { __notEqual: resolveValue(trimmedExpected) }
      }
    }
    else if (assertion === 'containsExactly' || assertion === 'containsExactlyInAnyOrder') {
      const values = splitArgs(expectedRaw).map(arg => resolveValue(arg))
      expected = values
    } else {
      const trimmedExpected = expectedRaw.trim()
      expectedInvocation = parseInvocation(trimmedExpected)
      if (expectedInvocation) {
        expected = {
          __invoke: {
            methodName: expectedInvocation.methodName,
            constructorArgs: expectedInvocation.constructorArgs || [],
            methodArgs: expectedInvocation.methodArgs || [],
            sameInstance: Boolean(
              expectedInvocation.instanceName &&
              invocation.instanceName &&
              expectedInvocation.instanceName === invocation.instanceName
            )
          }
        }
      } else {
        expected = resolveValue(trimmedExpected)
      }
    }

    cases.push({
      name: currentName || invocation.methodName,
      property: invocation.methodName,
      input: {
        __constructorArgs: invocation.constructorArgs,
        __args: invocation.methodArgs
      },
      expected,
      unordered: assertion === 'containsExactlyInAnyOrder'
    })
  }

  const flushExceptionCapture = () => {
    if (!captureException) return
    const normalized = normalizeWhitespace(captureException)
    captureException = null

    const match = normalized.match(/assertThatExceptionOfType\s*\(\s*([A-Za-z0-9_.]+)\.class\s*\)\s*\.isThrownBy\(\s*\(\s*\)\s*->\s*(.*?)\)\s*(?:\.withMessage\("([^"]+)"\))?\s*;/)
    if (!match) return
    const exceptionType = match[1]
    const expression = match[2]
    const invocation = parseInvocation(expression)
    if (!invocation) return

    cases.push({
      name: currentName || invocation.methodName,
      property: invocation.methodName,
      input: {
        __constructorArgs: invocation.constructorArgs,
        __args: invocation.methodArgs
      },
      expected: { error: exceptionType }
    })
  }

  const storeAssignment = (line) => {
    const assignmentMatch = line.match(/(?:^|\s)(?:[A-Za-z0-9_<>\\[\\]]+\s+)*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+);/)
    if (!assignmentMatch) return
    const varName = assignmentMatch[1]
    const expr = assignmentMatch[2].trim()
    if (expr.startsWith('new ')) {
      const ctor = parseConstructor(expr)
      if (ctor) {
        if (currentMode === 'before') globalInstances.set(varName, ctor)
        else localInstances.set(varName, ctor)
        return
      }
    }

    const listValue = parseListExpression(expr, resolveValue)
    if (listValue !== null) {
      if (currentMode === 'before') globalValues.set(varName, listValue)
      else localValues.set(varName, listValue)
      return
    }

    const invocation = parseInvocation(expr)
    if (invocation) {
      localCalls.set(varName, invocation)
      return
    }

    const literal = resolveValue(expr)
    if (currentMode === 'before') globalValues.set(varName, literal)
    else localValues.set(varName, literal)
  }

  for (const line of lines) {
    const nameMatch = line.match(/@DisplayName\("([^"]+)"\)/)
    if (nameMatch) {
      currentName = nameMatch[1]
    }

    if (line.includes('@BeforeEach')) {
      currentMode = 'before'
      continue
    }

    if (line.includes('@Test')) {
      currentMode = 'test'
      localValues = new Map()
      localInstances = new Map()
      localCalls = new Map()
      continue
    }

    if (captureException) {
      captureException += ` ${line.trim()}`
      if (line.includes(';')) {
        flushExceptionCapture()
      }
      continue
    }

    if (capture) {
      capture += ` ${line.trim()}`
      if (line.includes(');')) {
        flushCapture()
      }
      continue
    }

    if (line.includes('assertThatExceptionOfType(')) {
      captureException = line.trim()
      if (line.includes(';')) {
        flushExceptionCapture()
      }
      continue
    }

    if (line.includes('assertIsValidName(')) {
      const match = line.match(/assertIsValidName\s*\((.*)\)\s*;/)
      if (match) {
        const expr = match[1].trim()
        let invocation = parseInvocation(expr)
        if (!invocation && localCalls.has(expr)) invocation = localCalls.get(expr)
        if (!invocation && globalValues.has(expr)) invocation = null
        if (invocation) {
          const rawPattern = globalValues.get('EXPECTED_ROBOT_NAME_PATTERN') || "[A-Z]{2}\\\\d{3}"
          const pattern = typeof rawPattern === 'string' ? rawPattern.replace(/\\\\/g, '\\') : rawPattern
          cases.push({
            name: currentName || invocation.methodName,
            property: invocation.methodName,
            input: {
              __constructorArgs: invocation.constructorArgs || [],
              __args: invocation.methodArgs || []
            },
            expected: { __regex: pattern }
          })
        }
      }
      continue
    }

    if (line.includes('assertThat(')) {
      capture = line.trim()
      if (line.includes(');')) {
        flushCapture()
      }
      continue
    }

    storeAssignment(line)
  }

  if (capture) flushCapture()
  if (captureException) flushExceptionCapture()
  return cases
}
