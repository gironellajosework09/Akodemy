// Service for turning Judge0 technical errors into student-friendly guidance.
import crypto from 'crypto'
import OpenAI from 'openai'
import ErrorHumanizerCache from '../models/ErrorHumanizerCache.js'

const MODEL = 'gpt-5-nano'

const FALLBACK_FEEDBACK = {
  title: 'Execution Error',
  summary: "We couldn't format the error, but the technical details are below.",
  likely_cause: 'Raw runtime/compile output from Judge0.',
  action_steps: ['Review the technical error text.', 'Fix the issue and run again.'],
  highlights: [],
  confidence: 0.2
}

const WRONG_ANSWER_FEEDBACK = {
  title: 'Wrong Answer',
  summary: "Your program ran, but the output didn't match the expected result.",
  likely_cause: 'The logic may be incorrect or missing an edge case.',
  action_steps: [
    'Compare your output format and values with the expected output.',
    'Test a few small cases to find where the results diverge.'
  ],
  highlights: [],
  confidence: 0.35
}

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
      'likely_cause',
      'action_steps',
      'highlights',
      'confidence'
    ],
    properties: {
      title: { type: 'string' },
      summary: { type: 'string' },
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
  message
}) {
  const raw = [
    language,
    statusId,
    statusDescription,
    compileOutput,
    stderr,
    message
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

function isValidFeedback(feedback) {
  if (!feedback || typeof feedback !== 'object') return false
  if (!feedback.title || typeof feedback.title !== 'string') return false
  if (!feedback.summary || typeof feedback.summary !== 'string') return false
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
  const payload = {
    language: context?.language || '',
    challengeTitle: context?.challengeTitle || '',
    difficulty: context?.difficulty || '',
    status: {
      id: judge0Result?.status?.id ?? judge0Result?.statusId ?? null,
      description: judge0Result?.status?.description ?? judge0Result?.status ?? ''
    },
    compile_output: judge0Result?.compile_output ?? judge0Result?.compileOutput ?? '',
    stderr: judge0Result?.stderr ?? '',
    message: judge0Result?.message ?? '',
    exit_code: judge0Result?.exit_code ?? judge0Result?.exitCode ?? null
  }

  if (!payload.challengeTitle) delete payload.challengeTitle
  if (!payload.difficulty) delete payload.difficulty
  if (!payload.compile_output) delete payload.compile_output
  if (!payload.stderr) delete payload.stderr
  if (!payload.message) delete payload.message
  if (payload.exit_code === null || payload.exit_code === undefined) delete payload.exit_code
  if (!payload.status.description && (payload.status.id === null || payload.status.id === undefined)) {
    delete payload.status
  }

  return payload
}

function shouldHumanize(statusDescription, statusId, compileOutput, stderr, forceHumanize) {
  const normalizedStatus = String(statusDescription || '').toLowerCase()
  const hasCompileOutput = Boolean(compileOutput && compileOutput.trim())
  const hasStderr = Boolean(stderr && stderr.trim())
  const isWrongAnswer = normalizedStatus.includes('wrong answer')
  const isRuntime = normalizedStatus.includes('runtime error')
  const isTimeLimit = normalizedStatus.includes('time limit') || statusId === 5
  const isMemoryLimit = normalizedStatus.includes('memory limit')

  if (isWrongAnswer && !hasCompileOutput && !hasStderr && !forceHumanize) {
    return { shouldCall: false, useLocalWrongAnswer: true }
  }

  if (hasCompileOutput || hasStderr || isRuntime || isTimeLimit || isMemoryLimit || (forceHumanize && isWrongAnswer)) {
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

    const isAccepted = statusId === 3 || /accepted/i.test(statusDescription)
    if (isAccepted) return null

    const { shouldCall, useLocalWrongAnswer } = shouldHumanize(
      statusDescription,
      statusId,
      compileOutput,
      stderr,
      Boolean(context?.forceHumanize)
    )

    if (useLocalWrongAnswer) {
      return WRONG_ANSWER_FEEDBACK
    }

    if (!shouldCall) return null

    const cacheKey = buildCacheKey({
      language: context?.language || '',
      statusId,
      statusDescription,
      compileOutput,
      stderr,
      message
    })

    const cacheReady = ErrorHumanizerCache?.db?.readyState === 1
    if (cacheKey && cacheReady) {
      const cached = await ErrorHumanizerCache.findOne({ key: cacheKey }).lean()
      if (cached?.friendlyFeedbackJson) {
        return cached.friendlyFeedbackJson
      }
    }

    const openai = getOpenAIClient()
    if (!openai) {
      return FALLBACK_FEEDBACK
    }

    const payload = buildPayload(judge0Result, context)
    const instructions = [
      'You are an educational programming assistant. Convert Judge0 technical errors into student-friendly guidance.',
      'Do not invent details. If line numbers are not present, do not add them.',
      'Keep action_steps short, actionable, and between 2 and 5 items.',
      'Do not include line breaks in any string values; use spaces instead.',
      `Call the function ${TOOL_NAME} with arguments that match the required schema.`,
      'Do not output any other text.'
    ].join(' ')

    let response = await requestWithTool(openai, instructions, payload)

    if (response?.error) {
      debugLog('response.error', response.error)
      return FALLBACK_FEEDBACK
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
        return FALLBACK_FEEDBACK
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
        return FALLBACK_FEEDBACK
      }
      try {
        parsed = parseJsonWithRepair(retryText)
      } catch (retryError) {
        debugLog('parse_failed_retry', {
          length: retryText.length,
          preview: retryText.slice(0, 500)
        })
        console.error('Error humanizer JSON parse failed (retry):', retryError.message)
        return FALLBACK_FEEDBACK
      }
    }

    const allowLineHighlights = hasLineNumbers(`${compileOutput}\n${stderr}\n${message}`)
    parsed.highlights = sanitizeHighlights(parsed.highlights, allowLineHighlights)

    if (!isValidFeedback(parsed)) {
      debugLog('validation_failed', {
        title: parsed?.title,
        summary: parsed?.summary,
        likely_cause: parsed?.likely_cause,
        action_steps: parsed?.action_steps,
        highlights: parsed?.highlights,
        confidence: parsed?.confidence
      })
      return FALLBACK_FEEDBACK
    }

    if (cacheKey && cacheReady) {
      ErrorHumanizerCache.create({
        key: cacheKey,
        friendlyFeedbackJson: parsed
      }).catch(() => {})
    }

    return parsed
  } catch (error) {
    const status = error?.status || error?.response?.status
    const requestId = error?.request_id || error?.response?.headers?.['x-request-id']
    console.error('Error humanizer failed:', {
      status,
      requestId,
      message: error?.message
    })
    return FALLBACK_FEEDBACK
  }
}
