// Service for turning Judge0 technical errors into student-friendly guidance.
import crypto from 'crypto'
import OpenAI from 'openai'
import ErrorHumanizerCache from '../models/ErrorHumanizerCache.js'

const MODEL = 'gpt-5-nano'

const DEFAULT_CAUSES = [
  'The code behavior does not match the requirement for at least one case.',
  'A small syntax or logic detail may be causing the failure.'
]

const DEFAULT_FIXES = [
  'Read the first failing message and inspect the related lines in your code.',
  'Run again after one focused change so you can confirm what improved.'
]

const SYNTAX_PATTERNS = [
  /syntaxerror/i,
  /syntax error/i,
  /compilation error/i,
  /parse error/i,
  /parsererror/i,
  /indentationerror/i,
  /taberror/i,
  /unexpected token/i,
  /expected\s+['"`;)}\]]/i,
  /missing\s+[;)}\]]/i,
  /unterminated/i,
  /cannot find symbol/i
]

const RUNTIME_PATTERNS = [
  /runtime error/i,
  /nameerror/i,
  /referenceerror/i,
  /typeerror/i,
  /nullpointerexception/i,
  /cannot read propert(?:y|ies)/i,
  /attributeerror/i,
  /none(?:type)?/i,
  /indexerror/i,
  /out of range/i,
  /outofbounds/i,
  /zerodivisionerror/i,
  /division by zero/i,
  /keyerror/i,
  /stack overflow/i,
  /time limit/i,
  /memory limit/i
]

const TEST_PATTERNS = [
  /wrong answer/i,
  /assert/i,
  /expected/i,
  /\bgot\b/i,
  /tests? failed/i,
  /required function\(s\) not defined/i
]

let openaiClient = null
const DEBUG = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.ERROR_HUMANIZER_DEBUG || '').toLowerCase()
)

function debugLog(label, data) {
  if (!DEBUG) return
  console.log(`[ErrorHumanizer] ${label}`, data)
}

function getOpenAIClient() {
  if (openaiClient) return openaiClient
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  openaiClient = new OpenAI({ apiKey })
  return openaiClient
}

const RESPONSE_SCHEMA = {
  name: 'error_humanizer_feedback',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'title',
      'summary',
      'what_went_wrong',
      'why_this_happened',
      'what_to_check_or_fix',
      'likely_causes',
      'suggested_fixes',
      'likely_cause',
      'action_steps',
      'highlights',
      'confidence'
    ],
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
      what_went_wrong: { type: 'string' },
      why_this_happened: {
        type: 'array',
        items: { type: 'string' }
      },
      what_to_check_or_fix: {
        type: 'array',
        items: { type: 'string' }
      },
      likely_causes: {
        type: 'array',
        items: { type: 'string' }
      },
      suggested_fixes: {
        type: 'array',
        items: { type: 'string' }
      },
      likely_cause: { type: 'string' },
      action_steps: {
        type: 'array',
        items: { type: 'string' }
      },
      highlights: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['type', 'value'],
          properties: {
            type: { type: 'string', enum: ['line', 'token'] },
            value: { anyOf: [{ type: 'integer' }, { type: 'string' }] }
          }
        }
      },
      confidence: { type: 'number' }
    }
  }
}

const TOOL_NAME = 'humanize_error'
const FUNCTION_TOOL = {
  type: 'function',
  name: TOOL_NAME,
  description: 'Return student-friendly error feedback in the required JSON format.',
  strict: true,
  parameters: RESPONSE_SCHEMA.schema
}

function normalizeValue(value) {
  if (value === undefined || value === null) return ''
  return String(value)
}

function buildCacheKey({
  language,
  statusId,
  statusDescription,
  compileOutput,
  stderr,
  message,
  testFailure,
  submittedCode,
  problemInstructions
}) {
  const raw = [
    language,
    statusId,
    statusDescription,
    compileOutput,
    stderr,
    message,
    testFailure,
    submittedCode,
    problemInstructions
  ].map(normalizeValue).join('|')
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function hasLineNumbers(text) {
  if (!text) return false
  return /\bline\s+\d+\b/i.test(text) || /:\d+:\d+/.test(text)
}

function extractResponseText(response) {
  if (!response) return ''
  if (response.output_text) return response.output_text
  const firstOutput = response.output?.[0]
  const firstContent = firstOutput?.content?.[0]
  if (firstContent?.text) return firstContent.text
  if (firstContent?.json) return JSON.stringify(firstContent.json)
  if (firstContent?.parsed) return JSON.stringify(firstContent.parsed)
  return ''
}

function extractToolArguments(response) {
  const outputs = Array.isArray(response?.output) ? response.output : []
  const toolCall = outputs.find((item) => item?.type === 'function_call' && item?.name === TOOL_NAME)
  if (!toolCall?.arguments) return ''
  return toolCall.arguments
}

function repairJsonString(rawText) {
  let text = String(rawText || '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1)
  }

  let out = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]

    if (escaped) {
      out += ch
      escaped = false
      continue
    }

    if (ch === '\\') {
      out += ch
      escaped = true
      continue
    }

    if (ch === '"') {
      out += ch
      inString = !inString
      continue
    }

    if (inString) {
      if (ch === '\n') {
        out += '\\n'
        continue
      }
      if (ch === '\r') {
        continue
      }
      if (ch === '\t') {
        out += '\\t'
        continue
      }
      if (ch === '\u2028') {
        out += '\\u2028'
        continue
      }
      if (ch === '\u2029') {
        out += '\\u2029'
        continue
      }
    }

    out += ch
  }

  return out.replace(/,\s*([}\]])/g, '$1')
}

function parseJsonWithRepair(rawText) {
  try {
    return JSON.parse(rawText)
  } catch (error) {
    const repaired = repairJsonString(rawText)
    return JSON.parse(repaired)
  }
}

async function requestWithTool(openai, instructions, payload) {
  return openai.responses.create({
    model: MODEL,
    instructions,
    input: JSON.stringify(payload),
    max_output_tokens: 500,
    reasoning: { effort: 'low' },
    tools: [FUNCTION_TOOL],
    tool_choice: { type: 'function', name: TOOL_NAME }
  })
}

async function requestJsonObject(openai, instructions, payload) {
  return openai.responses.create({
    model: MODEL,
    instructions: `${instructions} Return only a JSON object and nothing else.`,
    input: JSON.stringify(payload),
    max_output_tokens: 500,
    text: { format: { type: 'json_object' } }
  })
}

function sanitizeHighlights(highlights, allowLineHighlights) {
  if (!Array.isArray(highlights)) return []
  return highlights.filter((item) => {
    if (!item || typeof item !== 'object') return false
    if (item.type === 'line') {
      return allowLineHighlights && Number.isInteger(item.value)
    }
    if (item.type === 'token') {
      return typeof item.value === 'string' && item.value.length > 0
    }
    return false
  })
}

function sanitizeInlineText(value) {
  if (value === undefined || value === null) return ''
  return String(value).replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncateText(value, maxLength = 180) {
  const text = sanitizeInlineText(value)
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trimEnd()}...`
}

function clamp(value, min, max) {
  const num = Number(value)
  if (Number.isNaN(num)) return min
  if (num < min) return min
  if (num > max) return max
  return num
}

function sentenceLimit(text, fallback) {
  const clean = sanitizeInlineText(text)
  if (!clean) return fallback
  const parts = clean.match(/[^.!?]+[.!?]?/g)
  if (!parts) return truncateText(clean, 240)
  const summary = parts
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(' ')
  return truncateText(summary || clean, 240)
}

function uniqueItems(values, limit = 5) {
  const seen = new Set()
  const out = []
  for (const raw of values || []) {
    const value = sanitizeInlineText(raw)
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(value)
    if (out.length >= limit) break
  }
  return out
}

function ensureList(items, fallbackItems, minCount = 2, maxCount = 5) {
  const list = uniqueItems(items, maxCount)
  if (list.length >= minCount) return list
  for (const item of fallbackItems) {
    const clean = sanitizeInlineText(item)
    if (!clean) continue
    if (!list.some(existing => existing.toLowerCase() === clean.toLowerCase())) {
      list.push(clean)
    }
    if (list.length >= minCount) break
  }
  return list.slice(0, maxCount)
}

function extractUndefinedIdentifier(text) {
  const raw = String(text || '')
  const patterns = [
    /name ['"`]?([A-Za-z_]\w*)['"`]? is not defined/i,
    /referenceerror:\s*([A-Za-z_]\w*) is not defined/i,
    /([A-Za-z_]\w*) is not defined/i,
    /cannot find symbol.*?variable\s+([A-Za-z_]\w*)/is
  ]
  for (const pattern of patterns) {
    const match = raw.match(pattern)
    if (match?.[1]) return match[1]
  }
  return ''
}

function buildTestFingerprint(testResults) {
  if (!testResults || testResults.passed !== false) return ''
  return JSON.stringify({
    failedCount: testResults.failedCount ?? null,
    total: testResults.total ?? null,
    message: truncateText(testResults.message || '', 160),
    expected: truncateText(testResults.expected || '', 160),
    actual: truncateText(testResults.actual || '', 160)
  })
}

function classifyFailure({
  statusDescription,
  statusId,
  compileOutput,
  stderr,
  message,
  testResults
}) {
  const status = String(statusDescription || '').toLowerCase()
  const combined = [compileOutput, stderr, message, statusDescription]
    .map(value => String(value || ''))
    .join('\n')
  const hasFailedTests = Boolean(testResults && testResults.passed === false)
  const hasSyntax = SYNTAX_PATTERNS.some(pattern => pattern.test(combined)) || status.includes('compile')
  const hasRuntime =
    RUNTIME_PATTERNS.some(pattern => pattern.test(combined)) ||
    status.includes('runtime error') ||
    status.includes('time limit') ||
    status.includes('memory limit') ||
    statusId === 5
  const hasTestSignal = hasFailedTests || TEST_PATTERNS.some(pattern => pattern.test(combined))

  if (hasSyntax) return 'syntax'
  if (hasRuntime) return 'runtime'
  if (hasTestSignal) return 'test'
  return 'unknown'
}

function parseMissingDefinitions(testResults) {
  const names = []
  const actual = String(testResults?.actual || '')
  const message = String(testResults?.message || '')

  const missingFromActual = actual.match(/missing:\s*(.+)$/i)
  if (missingFromActual?.[1]) {
    missingFromActual[1]
      .split(',')
      .map(name => sanitizeInlineText(name))
      .filter(Boolean)
      .forEach((name) => names.push(name))
  }

  const missingFromMessage = message.match(/missing required function:\s*([A-Za-z_]\w*)/i)
  if (missingFromMessage?.[1]) {
    names.push(missingFromMessage[1])
  }

  return uniqueItems(names, 5)
}

function normalizeExpectedActual(value) {
  return sanitizeInlineText(value).replace(/^["']|["']$/g, '')
}

function inferSubmissionSignals({
  language,
  submittedCode,
  testResults
}) {
  const code = String(submittedCode || '')
  const lang = String(language || '').toLowerCase()
  const expectedRaw = String(testResults?.expected ?? '')
  const actualRaw = String(testResults?.actual ?? '')
  const expected = normalizeExpectedActual(expectedRaw)
  const actual = normalizeExpectedActual(actualRaw)
  const missingDefinitions = parseMissingDefinitions(testResults)

  const hasFunctionDefinition =
    /\bdef\s+[A-Za-z_]\w*\s*\(/.test(code) ||
    /\bfunction\s+[A-Za-z_]\w*\s*\(/.test(code) ||
    /\bconst\s+[A-Za-z_]\w*\s*=\s*\(/.test(code) ||
    /\bclass\s+[A-Za-z_]\w*/.test(code)
  const hasReturn = /\breturn\b/.test(code)

  const hasPrint =
    (lang === 'python' && /\bprint\s*\(/.test(code)) ||
    (lang === 'javascript' && /\bconsole\.log\s*\(/.test(code)) ||
    (lang === 'java' && /System\.out\.print(?:ln)?\s*\(/.test(code)) ||
    /\bprint\s*\(/.test(code)

  const normalizedActual = actual.toLowerCase()
  const returningNone =
    ['none', 'null', 'undefined', 'nan'].includes(normalizedActual) ||
    /^error:\s*none$/i.test(actualRaw)

  const missingReturn = hasFunctionDefinition && !hasReturn
  const printMisuse = hasPrint && (missingReturn || returningNone)

  const hasExpectedActual =
    Boolean(expected && expected !== 'N/A') &&
    Boolean(actual && actual !== 'N/A')

  const caseOrTypoMismatch =
    hasExpectedActual &&
    expected.toLowerCase() === actual.toLowerCase() &&
    expected !== actual

  const spacingOrFormatMismatch =
    hasExpectedActual &&
    expected.replace(/\s+/g, ' ') === actual.replace(/\s+/g, ' ') &&
    expected !== actual

  return {
    missingDefinitions,
    missingReturn,
    returningNone,
    printMisuse,
    hasExpectedActual,
    caseOrTypoMismatch,
    spacingOrFormatMismatch,
    expected,
    actual
  }
}

function buildFeedback({
  title,
  summary,
  likelyCauses,
  suggestedFixes,
  confidence,
  highlights = []
}) {
  const normalizedLikelyCauses = ensureList(likelyCauses, DEFAULT_CAUSES, 2, 5)
  const normalizedSuggestedFixes = ensureList(suggestedFixes, DEFAULT_FIXES, 2, 5)
  const safeTitle = sanitizeInlineText(title) || 'Code Issue'
  const safeSummary = sentenceLimit(summary, "There is an issue in your submission that needs a closer check.")

  return {
    title: safeTitle,
    summary: safeSummary,
    what_went_wrong: safeSummary,
    why_this_happened: normalizedLikelyCauses,
    what_to_check_or_fix: normalizedSuggestedFixes,
    likely_causes: normalizedLikelyCauses,
    suggested_fixes: normalizedSuggestedFixes,
    likely_cause: normalizedLikelyCauses[0],
    action_steps: normalizedSuggestedFixes,
    highlights: Array.isArray(highlights) ? highlights : [],
    confidence: clamp(confidence, 0, 1)
  }
}

function buildLocalFeedback(input) {
  const {
    category,
    language,
    compileOutput,
    stderr,
    message,
    testResults,
    submittedCode,
    problemInstructions
  } = input

  const rawText = [compileOutput, stderr, message].filter(Boolean).join('\n')
  const lang = sanitizeInlineText(language) || 'this language'
  const inferred = inferSubmissionSignals({
    language,
    submittedCode,
    testResults
  })
  const expected = truncateText(inferred.expected || testResults?.expected, 90)
  const actual = truncateText(inferred.actual || testResults?.actual, 90)
  const missingList = inferred.missingDefinitions
  const hasInstructionContext = Boolean(sanitizeInlineText(problemInstructions))

  if (category === 'syntax') {
    const isIndentationIssue = /indentationerror|taberror|indentation/i.test(rawText)
    const isSemicolonStyle = /expected\s+['"`;]|missing\s*;|';' expected/i.test(rawText)
    return buildFeedback({
      title: 'Syntax Issue',
      summary: isIndentationIssue
        ? 'Your code has a syntax issue related to code alignment, so it cannot run yet.'
        : 'Your code has a syntax issue, so the program stops before running any tests.',
      likelyCauses: [
        isSemicolonStyle
          ? 'A statement is missing a required separator like a semicolon or closing symbol.'
          : `A bracket, quote, or keyword is misplaced in your ${lang} code.`,
        isIndentationIssue
          ? 'One or more lines are indented inconsistently inside a block.'
          : 'A block may have unmatched parentheses, brackets, or braces.',
        'There may be a typo near the first line mentioned in the technical message.'
      ],
      suggestedFixes: [
        'Start at the first reported line and inspect one line above and below it.',
        'Match every opening bracket/quote with a closing one in the same block.',
        isIndentationIssue
          ? 'Use consistent indentation for the whole block (tabs or spaces, not both).'
          : 'Re-run after each small syntax fix to confirm the parser gets further.'
      ],
      confidence: 0.7
    })
  }

  if (category === 'runtime') {
    const undefinedName = extractUndefinedIdentifier(rawText)
    const isNullAccess = /nullpointerexception|cannot read propert(?:y|ies)|none(?:type)?|undefined/i.test(rawText)
    const isIndexIssue = /indexerror|out of range|outofbounds/i.test(rawText)
    const isTypeIssue = /typeerror|classcastexception|unsupported operand/i.test(rawText)

    if (undefinedName) {
      return buildFeedback({
        title: 'Runtime Error',
        summary: `Your code runs into a runtime error because '${undefinedName}' is being used before it is available.`,
        likelyCauses: [
          `'${undefinedName}' was not declared, assigned, or imported before use.`,
          'The variable/function name may be misspelled in one place.',
          'The value might only exist inside a different scope.'
        ],
        suggestedFixes: [
          `Find every use of '${undefinedName}' and verify where it is first defined.`,
          'Check naming consistency, including uppercase/lowercase differences.',
          'Move the declaration or pass the needed value into the current function.'
        ],
        confidence: 0.78
      })
    }

    if (isNullAccess) {
      return buildFeedback({
        title: 'Runtime Error',
        summary: 'Your code is trying to use a value that is null, None, or undefined at runtime.',
        likelyCauses: [
          'An object/variable is empty before a property or method is accessed.',
          'A function returned no value when later code expected a valid object.',
          'Input data did not contain the field your code assumes exists.'
        ],
        suggestedFixes: [
          'Check where that value is created and confirm it is set before use.',
          'Add a guard condition before property/index access.',
          'Print or log the value right before the failing line to verify its state.'
        ],
        confidence: 0.75
      })
    }

    if (isIndexIssue) {
      return buildFeedback({
        title: 'Runtime Error',
        summary: 'Your code is accessing an index that is outside the valid range.',
        likelyCauses: [
          'Loop bounds go past the last valid position.',
          'The collection is smaller than expected for some inputs.',
          'An index calculation is off by one.'
        ],
        suggestedFixes: [
          'Check loop start/end conditions and compare them with collection length.',
          'Add bounds checks before indexing.',
          'Test with small inputs (empty and one-item cases) to catch edge behavior.'
        ],
        confidence: 0.76
      })
    }

    if (isTypeIssue) {
      return buildFeedback({
        title: 'Runtime Error',
        summary: 'Your code is using a value with an unexpected type during execution.',
        likelyCauses: [
          'A function receives a different type than your logic assumes.',
          'String/number or object/list operations are mixed incorrectly.',
          'A conversion step is missing before the operation.'
        ],
        suggestedFixes: [
          'Inspect the values used in the failing operation and confirm their types.',
          'Convert or validate values before arithmetic, indexing, or method calls.',
          'Use simple test inputs to verify each step returns the expected type.'
        ],
        confidence: 0.73
      })
    }

    return buildFeedback({
      title: 'Runtime Error',
      summary: 'Your code starts running but stops due to an execution error.',
      likelyCauses: [
        'A value, index, or object state at runtime is not what the code expects.',
        'A boundary case (empty input, null/None, or large values) is not handled.',
        'The failing branch is reached only for certain test inputs.'
      ],
      suggestedFixes: [
        'Read the first runtime error line and trace the variables on that path.',
        'Add quick debug prints near the failing branch to inspect values.',
        'Handle boundary cases before main processing logic.'
      ],
      confidence: 0.65
    })
  }

  if (category === 'test') {
    const hasExpectedActual = expected && expected !== 'N/A' && actual && actual !== 'N/A'
    const hasMissingDefinitions = missingList.length > 0 || /required function\(s\) not defined/i.test(String(testResults?.message || ''))
    const hasReturnIssue = inferred.returningNone || inferred.missingReturn
    const hasPrintIssue = inferred.printMisuse
    const hasValueFormattingIssue = inferred.caseOrTypoMismatch || inferred.spacingOrFormatMismatch

    if (hasMissingDefinitions) {
      const listedNames = missingList.length > 0 ? ` (${missingList.join(', ')})` : ''
      return buildFeedback({
        title: 'Test Case Failed',
        summary: `Your code runs, but tests could not find the expected function or class name${listedNames}.`,
        likelyCauses: [
          'A required function name is incorrect, misspelled, or uses a different naming style.',
          'The function/class may be nested or not declared where tests can import it.',
          'The challenge expects exact names, including uppercase/lowercase characters.'
        ],
        suggestedFixes: [
          'Match required function/class names exactly as written in the instructions/tests.',
          'Declare required definitions at top/module scope so tests can access them.',
          'Re-run after fixing naming first before changing the algorithm.'
        ],
        confidence: 0.82
      })
    }

    if (hasPrintIssue) {
      return buildFeedback({
        title: 'Test Case Failed',
        summary: 'Your code appears to print a result instead of returning it, so tests read the wrong value.',
        likelyCauses: [
          'The function uses print/log output where a return value is expected.',
          'The function may end without an explicit return statement.',
          inferred.returningNone
            ? 'The current function path returns None/null/undefined for at least one test.'
            : 'The result value is not passed back to the caller.'
        ],
        suggestedFixes: [
          'Keep debug prints optional, but make sure the final value is returned from the function.',
          'Verify every branch ends with the expected return value.',
          'Run one failing input and confirm the function output (not console output) matches expected.'
        ],
        confidence: 0.8
      })
    }

    if (hasReturnIssue) {
      return buildFeedback({
        title: 'Test Case Failed',
        summary: 'Your code runs, but at least one path returns None/null/undefined instead of the expected value.',
        likelyCauses: [
          'A return statement is missing in one or more branches.',
          'A conditional path exits without returning the computed result.',
          'The function may rely on side effects instead of returning a value.'
        ],
        suggestedFixes: [
          'Review each branch and ensure it returns the required output type/value.',
          'Check early exits and default paths that may return nothing.',
          'Compare expected and actual values for one failing case after each return fix.'
        ],
        confidence: 0.79
      })
    }

    if (hasValueFormattingIssue) {
      return buildFeedback({
        title: 'Test Case Failed',
        summary: hasExpectedActual
          ? `Your output is close, but tests expected ${expected} and got ${actual}.`
          : 'Your output value or format is slightly different from what tests expect.',
        likelyCauses: [
          inferred.caseOrTypoMismatch
            ? 'The value differs by case or small typo even though the core logic is close.'
            : 'The output format differs (spacing, punctuation, or structure).',
          'The final formatting step may not follow the exact challenge requirement.',
          'An extra character or missing delimiter changes the result.'
        ],
        suggestedFixes: [
          'Compare expected and actual output character-by-character.',
          'Check capitalization, punctuation, spacing, and ordering of output elements.',
          'Validate the exact return/output format described in the instructions.'
        ],
        confidence: hasExpectedActual ? 0.78 : 0.7
      })
    }

    return buildFeedback({
      title: 'Test Case Failed',
      summary: hasExpectedActual
        ? `Your code runs, but at least one test expected ${expected} and got ${actual}.`
        : 'Your code runs, but one or more tests still fail.',
      likelyCauses: [
        'An edge case is not handled correctly in your current logic.',
        'Output format or return value shape does not match what tests expect.',
        hasInstructionContext
          ? 'The implementation may not fully follow a detail from the problem instructions.'
          : 'A condition branch returns a different value than intended.'
      ],
      suggestedFixes: [
        'Recreate the failing case and trace each step of your logic.',
        'Compare both value and format of your output with the expected result.',
        'Check condition order and final return statements for edge inputs.'
      ],
      confidence: hasExpectedActual ? 0.72 : 0.62
    })
  }

  return buildFeedback({
    title: 'Execution Issue',
    summary: 'Your submission failed, but the error message is unclear, so this is a best-guess guide.',
    likelyCauses: [
      'A syntax, runtime, or logic issue occurred without a detailed tool message.',
      hasInstructionContext
        ? 'The current code behavior may differ from a key instruction requirement.'
        : 'The failing path might only appear on specific hidden test inputs.',
      'The program may be stopping before producing meaningful output.'
    ],
    suggestedFixes: [
      'Run with small custom inputs and verify each intermediate step.',
      'Add temporary logs around key branches to locate where behavior diverges.',
      'Check technical details for the first error clue, then fix one issue at a time.'
    ],
    confidence: 0.45
  })
}

function normalizeFeedback(feedback, allowLineHighlights) {
  if (!feedback || typeof feedback !== 'object') return null

  const likelyCauses = uniqueItems([
    ...(Array.isArray(feedback.why_this_happened) ? feedback.why_this_happened : []),
    ...(Array.isArray(feedback.likely_causes) ? feedback.likely_causes : []),
    feedback.likely_cause
  ])

  const suggestedFixes = uniqueItems([
    ...(Array.isArray(feedback.what_to_check_or_fix) ? feedback.what_to_check_or_fix : []),
    ...(Array.isArray(feedback.suggested_fixes) ? feedback.suggested_fixes : []),
    ...(Array.isArray(feedback.action_steps) ? feedback.action_steps : [])
  ])

  const normalized = buildFeedback({
    title: feedback.title,
    summary: feedback.what_went_wrong || feedback.summary,
    likelyCauses,
    suggestedFixes,
    confidence: clamp(feedback.confidence, 0, 1),
    highlights: sanitizeHighlights(feedback.highlights, allowLineHighlights)
  })

  return normalized
}

function isValidFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') return false
  if (!feedback.title || typeof feedback.title !== 'string') return false
  if (!feedback.summary || typeof feedback.summary !== 'string') return false
  if (!feedback.what_went_wrong || typeof feedback.what_went_wrong !== 'string') return false
  if (!Array.isArray(feedback.why_this_happened)) return false
  if (feedback.why_this_happened.length < 2 || feedback.why_this_happened.length > 5) return false
  if (!feedback.why_this_happened.every(item => typeof item === 'string' && item.trim().length > 0)) return false
  if (!Array.isArray(feedback.what_to_check_or_fix)) return false
  if (feedback.what_to_check_or_fix.length < 2 || feedback.what_to_check_or_fix.length > 5) return false
  if (!feedback.what_to_check_or_fix.every(item => typeof item === 'string' && item.trim().length > 0)) return false
  if (!Array.isArray(feedback.likely_causes)) return false
  if (feedback.likely_causes.length < 2 || feedback.likely_causes.length > 5) return false
  if (!feedback.likely_causes.every(item => typeof item === 'string' && item.trim().length > 0)) return false
  if (!Array.isArray(feedback.suggested_fixes)) return false
  if (feedback.suggested_fixes.length < 2 || feedback.suggested_fixes.length > 5) return false
  if (!feedback.suggested_fixes.every(item => typeof item === 'string' && item.trim().length > 0)) return false
  if (!feedback.likely_cause || typeof feedback.likely_cause !== 'string') return false
  if (!Array.isArray(feedback.action_steps)) return false
  if (feedback.action_steps.length < 2 || feedback.action_steps.length > 5) return false
  if (!feedback.action_steps.every(step => typeof step === 'string' && step.trim().length > 0)) return false
  if (!Array.isArray(feedback.highlights)) return false
  if (typeof feedback.confidence !== 'number') return false
  if (feedback.confidence < 0 || feedback.confidence > 1) return false
  return true
}

function buildPayload(judge0Result, context) {
  const testFailure = context?.testResults && context.testResults.passed === false
    ? {
        failed_count: context.testResults.failedCount ?? null,
        total: context.testResults.total ?? null,
        message: truncateText(context.testResults.message || '', 160),
        expected: truncateText(context.testResults.expected || '', 140),
        actual: truncateText(context.testResults.actual || '', 140)
      }
    : null
  const problemInstructions = truncateText(
    context?.problemInstructions || context?.instructions || '',
    2200
  )
  const submittedCode = truncateText(
    context?.submittedCode || context?.code || '',
    2600
  )

  const payload = {
    language: context?.language || '',
    challengeTitle: context?.challengeTitle || '',
    difficulty: context?.difficulty || '',
    error_priority: ['syntax', 'runtime', 'test'],
    primary_error_category: context?.primaryErrorCategory || '',
    status: {
      id: judge0Result?.status?.id ?? judge0Result?.statusId ?? null,
      description: judge0Result?.status?.description ?? judge0Result?.status ?? ''
    },
    compile_output: truncateText(judge0Result?.compile_output ?? judge0Result?.compileOutput ?? '', 1200),
    stderr: truncateText(judge0Result?.stderr ?? '', 1200),
    message: truncateText(judge0Result?.message ?? '', 600),
    exit_code: judge0Result?.exit_code ?? judge0Result?.exitCode ?? null
  }

  if (testFailure) {
    payload.test_failure = testFailure
  }
  if (problemInstructions) {
    payload.problem_instructions = problemInstructions
  }
  if (submittedCode) {
    payload.submitted_code = submittedCode
  }

  if (!payload.challengeTitle) delete payload.challengeTitle
  if (!payload.difficulty) delete payload.difficulty
  if (!payload.compile_output) delete payload.compile_output
  if (!payload.stderr) delete payload.stderr
  if (!payload.message) delete payload.message
  if (!payload.primary_error_category) delete payload.primary_error_category
  if (!payload.test_failure) delete payload.test_failure
  if (!payload.problem_instructions) delete payload.problem_instructions
  if (!payload.submitted_code) delete payload.submitted_code
  if (payload.exit_code === null || payload.exit_code === undefined) delete payload.exit_code
  if (!payload.status.description && (payload.status.id === null || payload.status.id === undefined)) {
    delete payload.status
  }

  return payload
}

function shouldHumanize({
  statusDescription,
  statusId,
  compileOutput,
  stderr,
  message,
  forceHumanize,
  hasFailedTests
}) {
  const normalizedStatus = String(statusDescription || '').toLowerCase()
  const hasCompileOutput = Boolean(compileOutput && compileOutput.trim())
  const hasStderr = Boolean(stderr && stderr.trim())
  const hasMessage = Boolean(message && message.trim())
  const isWrongAnswer = normalizedStatus.includes('wrong answer')
  const isRuntime = normalizedStatus.includes('runtime error')
  const isTimeLimit = normalizedStatus.includes('time limit') || statusId === 5
  const isMemoryLimit = normalizedStatus.includes('memory limit')
  const isAccepted = normalizedStatus.includes('accepted') || statusId === 3
  const hasStatusInfo = Boolean(normalizedStatus) || (statusId !== null && statusId !== undefined)
  const isNonAcceptedStatus = hasStatusInfo && !isAccepted

  if (isWrongAnswer && !hasCompileOutput && !hasStderr && !hasMessage && !hasFailedTests && !forceHumanize) {
    return { shouldCall: false, useLocalWrongAnswer: true }
  }

  if (hasFailedTests || hasCompileOutput || hasStderr || hasMessage || isRuntime || isTimeLimit || isMemoryLimit || isNonAcceptedStatus || (forceHumanize && isWrongAnswer)) {
    return { shouldCall: true, useLocalWrongAnswer: false }
  }

  return { shouldCall: false, useLocalWrongAnswer: false }
}

export async function humanizeJudge0Error(judge0Result, context = {}) {
  try {
    const statusId = judge0Result?.status?.id ?? judge0Result?.statusId ?? null
    const statusDescription = judge0Result?.status?.description ?? judge0Result?.status ?? ''
    const compileOutput = judge0Result?.compile_output ?? judge0Result?.compileOutput ?? ''
    const stderr = judge0Result?.stderr ?? ''
    const message = judge0Result?.message ?? ''
    const hasFailedTests = Boolean(context?.testResults && context.testResults.passed === false)
    const allowLineHighlights = hasLineNumbers(`${compileOutput}\n${stderr}\n${message}`)
    const primaryErrorCategory = classifyFailure({
      statusDescription,
      statusId,
      compileOutput,
      stderr,
      message,
      testResults: context?.testResults
    })
    const localFeedback = buildLocalFeedback({
      category: primaryErrorCategory,
      language: context?.language,
      compileOutput,
      stderr,
      message,
      testResults: context?.testResults,
      submittedCode: context?.submittedCode || context?.code,
      problemInstructions: context?.problemInstructions || context?.instructions
    })

    const isAccepted = statusId === 3 || /accepted/i.test(statusDescription)
    if (isAccepted && !hasFailedTests && !context?.forceHumanize) return null

    const { shouldCall, useLocalWrongAnswer } = shouldHumanize({
      statusDescription,
      statusId,
      compileOutput,
      stderr,
      message,
      hasFailedTests,
      forceHumanize: Boolean(context?.forceHumanize)
    })

    if (useLocalWrongAnswer) {
      return buildFeedback({
        title: 'Wrong Answer',
        summary: "Your program ran, but the output didn't match the expected behavior.",
        likelyCauses: [
          'The logic may be incorrect for one or more edge cases.',
          'The returned value or output format differs from what tests expect.'
        ],
        suggestedFixes: [
          'Compare your result against the expected result for a small failing case.',
          'Trace conditions and return statements to find where behavior diverges.'
        ],
        confidence: 0.4
      })
    }

    if (!shouldCall) return null

    const testFailure = buildTestFingerprint(context?.testResults)
    const cacheKey = buildCacheKey({
      language: context?.language || '',
      statusId,
      statusDescription,
      compileOutput,
      stderr,
      message,
      testFailure,
      submittedCode: context?.submittedCode || context?.code || '',
      problemInstructions: context?.problemInstructions || context?.instructions || ''
    })

    const cacheReady = ErrorHumanizerCache?.db?.readyState === 1
    if (cacheKey && cacheReady) {
      const cached = await ErrorHumanizerCache.findOne({ key: cacheKey }).lean()
      if (cached?.friendlyFeedbackJson) {
        const normalizedCached = normalizeFeedback(cached.friendlyFeedbackJson, allowLineHighlights)
        if (isValidFeedback(normalizedCached)) {
          return normalizedCached
        }
      }
    }

    const openai = getOpenAIClient()
    if (!openai) {
      return localFeedback
    }

    const payload = buildPayload(judge0Result, { ...context, primaryErrorCategory })
    const instructions = [
      'You are an educational programming assistant. Convert technical run/test errors into beginner-friendly guidance.',
      'You are only an explanatory layer and must not suggest changing any platform/system component.',
      'Follow this strict structure: What went wrong, Why this happened, What to check or fix.',
      'Populate what_went_wrong as a 1-2 sentence explanation.',
      'Populate why_this_happened and what_to_check_or_fix as bullet-ready arrays with 2-5 items each.',
      'Prioritize issues in this order when multiple signals exist: syntax errors first, then runtime errors, then failing tests.',
      'Cover common student issues: incorrect function names, missing/incorrect return statements, returning None/null/undefined, wrong output values/formatting, and misuse of print/log.',
      'For failed tests, explain expected vs actual behavior in plain language.',
      'If the error details are unclear or undefined, provide a best-guess but still actionable guidance.',
      'Do not reveal exact final solutions or full corrected code.',
      'Do not invent details. If line numbers are not present, do not add them.',
      'Do not include line breaks in any string values; use spaces instead.',
      `Call the function ${TOOL_NAME} with arguments that match the required schema.`,
      'Do not output any other text.'
    ].join(' ')

    let response = await requestWithTool(openai, instructions, payload)

    if (response?.error) {
      debugLog('response.error', response.error)
      return localFeedback
    }

    let rawText = extractToolArguments(response)
    if (!rawText) {
      rawText = extractResponseText(response)
    }
    if (!rawText) {
      debugLog('empty_output', {
        output_text: response?.output_text,
        output_length: response?.output?.length,
        output_types: Array.isArray(response?.output) ? response.output.map(item => item?.type) : [],
        first_output_type: response?.output?.[0]?.type,
        first_content: response?.output?.[0]?.content?.[0]
      })
      debugLog('retrying_with_json_object', true)
      response = await requestJsonObject(openai, instructions, payload)
      rawText = extractResponseText(response)
      if (!rawText) {
        debugLog('empty_output_after_retry', {
          output_text: response?.output_text,
          output_length: response?.output?.length,
          output_types: Array.isArray(response?.output) ? response.output.map(item => item?.type) : []
        })
        return localFeedback
      }
    }

    let parsed
    try {
      parsed = parseJsonWithRepair(rawText)
    } catch (parseError) {
      debugLog('parse_failed', {
        length: rawText.length,
        preview: rawText.slice(0, 500)
      })
      console.error('Error humanizer JSON parse failed:', parseError.message)
      debugLog('retrying_after_parse_failure', true)
      const retryResponse = await requestJsonObject(openai, instructions, payload)
      const retryText = extractResponseText(retryResponse)
      if (!retryText) {
        return localFeedback
      }
      try {
        parsed = parseJsonWithRepair(retryText)
      } catch (retryError) {
        debugLog('parse_failed_retry', {
          length: retryText.length,
          preview: retryText.slice(0, 500)
        })
        console.error('Error humanizer JSON parse failed (retry):', retryError.message)
        return localFeedback
      }
    }

    const normalizedParsed = normalizeFeedback(parsed, allowLineHighlights)

    if (!isValidFeedback(normalizedParsed)) {
      debugLog('validation_failed', {
        title: normalizedParsed?.title,
        summary: normalizedParsed?.summary,
        what_went_wrong: normalizedParsed?.what_went_wrong,
        why_this_happened: normalizedParsed?.why_this_happened,
        what_to_check_or_fix: normalizedParsed?.what_to_check_or_fix,
        likely_causes: normalizedParsed?.likely_causes,
        suggested_fixes: normalizedParsed?.suggested_fixes,
        highlights: normalizedParsed?.highlights,
        confidence: normalizedParsed?.confidence
      })
      return localFeedback
    }

    if (cacheKey && cacheReady) {
      ErrorHumanizerCache.create({
        key: cacheKey,
        friendlyFeedbackJson: normalizedParsed
      }).catch(() => {})
    }

    return normalizedParsed
  } catch (error) {
    const status = error?.status || error?.response?.status
    const requestId = error?.request_id || error?.response?.headers?.['x-request-id']
    console.error('Error humanizer failed:', {
      status,
      requestId,
      message: error?.message
    })
    const statusDescription = judge0Result?.status?.description ?? judge0Result?.status ?? ''
    const statusId = judge0Result?.status?.id ?? judge0Result?.statusId ?? null
    const compileOutput = judge0Result?.compile_output ?? judge0Result?.compileOutput ?? ''
    const stderr = judge0Result?.stderr ?? ''
    const message = judge0Result?.message ?? ''
    const category = classifyFailure({
      statusDescription,
      statusId,
      compileOutput,
      stderr,
      message,
      testResults: context?.testResults
    })
    return buildLocalFeedback({
      category,
      language: context?.language,
      compileOutput,
      stderr,
      message,
      testResults: context?.testResults,
      submittedCode: context?.submittedCode || context?.code,
      problemInstructions: context?.problemInstructions || context?.instructions
    })
  }
}
