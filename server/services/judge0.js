// Judge0 API client for code execution.
import axios from 'axios'

// Service logic for Judge0.
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'
const DEFAULT_CPU_TIME_LIMIT = parseFloat(process.env.JUDGE0_CPU_TIME_LIMIT || '2')
const DEFAULT_WALL_TIME_LIMIT = parseFloat(process.env.JUDGE0_WALL_TIME_LIMIT || '4')

function normalizeLimit(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62
}

function toBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64')
}

function fromBase64(str) {
  if (!str) return ''
  try {
    return Buffer.from(str, 'base64').toString('utf-8')
  } catch {
    return str
  }
}

export async function executeCode(code, languageOrId, stdin = '', options = {}) {
  let languageId
  
  if (typeof languageOrId === 'number') {
    languageId = languageOrId
  } else {
    languageId = LANGUAGE_IDS[languageOrId]
    if (!languageId) {
      throw new Error(`Unsupported language: ${languageOrId}`)
    }
  }

  const cpuTimeLimit = normalizeLimit(options.cpuTimeLimit, DEFAULT_CPU_TIME_LIMIT)
  const wallTimeLimit = normalizeLimit(options.wallTimeLimit, DEFAULT_WALL_TIME_LIMIT)

  try {
    const submitResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=true&wait=true`,
      {
        source_code: toBase64(code),
        language_id: languageId,
        stdin: stdin ? toBase64(stdin) : '',
        cpu_time_limit: cpuTimeLimit,
        wall_time_limit: wallTimeLimit
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const result = submitResponse.data
    const statusDescription = result.status?.description || 'Unknown'
    const statusId = result.status?.id
    const stdout = fromBase64(result.stdout) || ''
    const stderr = fromBase64(result.stderr) || ''
    const compileOutput = fromBase64(result.compile_output) || ''
    const message = fromBase64(result.message) || ''
    const exitCode = result.exit_code
    const effectiveStderr = (statusId && statusId !== 3 && !stderr && !compileOutput)
      ? statusDescription
      : stderr
    const error = effectiveStderr || compileOutput || null

    return {
      status: statusDescription,
      statusId,
      stdout,
      stderr: effectiveStderr,
      compileOutput,
      message,
      exitCode,
      time: result.time,
      memory: result.memory,
      error
    }
  } catch (error) {
    console.error('Judge0 execution error:', error.response?.data || error.message)
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        status: 'Timeout',
        statusId: 5,
        stdout: '',
        stderr: 'Execution timed out',
        error: 'Your code took too long to execute. Please optimize your solution.'
      }
    }
    
    return {
      status: 'Error',
      statusId: -1,
      stdout: '',
      stderr: error.message,
      error: 'Failed to execute code. Please try again.'
    }
  }
}



