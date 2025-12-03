import axios from 'axios'

const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com'

const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62
}

export async function executeCode(code, language, stdin = '') {
  const languageId = LANGUAGE_IDS[language]
  
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`)
  }

  try {
    const submitResponse = await axios.post(
      `${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const result = submitResponse.data
    
    return {
      status: result.status?.description || 'Unknown',
      statusId: result.status?.id,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compileOutput: result.compile_output || '',
      time: result.time,
      memory: result.memory,
      error: result.stderr || result.compile_output || null
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
