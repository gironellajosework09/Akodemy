import { executeCode } from './judge0.js'

const analyzeCodeReadability = (code, language) => {
  let score = 100
  const lines = code.split('\n')
  
  if (lines.some(line => line.length > 120)) score -= 10
  
  const commentPatterns = {
    javascript: /\/\/|\/\*|\*\//,
    python: /#|"""|'''/,
    java: /\/\/|\/\*|\*\//
  }
  const hasComments = lines.some(line => commentPatterns[language]?.test(line))
  if (!hasComments && lines.length > 10) score -= 10
  
  const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length
  if (avgLineLength > 80) score -= 10
  
  const emptyLines = lines.filter(line => line.trim() === '').length
  if (emptyLines < lines.length * 0.05 && lines.length > 20) score -= 10
  
  return Math.max(0, Math.min(100, score)) / 100
}

const analyzeLogicStructure = (code, language) => {
  let score = 0
  let maxScore = 0
  
  const patterns = {
    hasFunction: {
      javascript: /function\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|=>\s*{/,
      python: /def\s+\w+/,
      java: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/
    },
    hasLoop: {
      javascript: /for\s*\(|while\s*\(|\.forEach|\.map|\.filter|\.reduce/,
      python: /for\s+\w+\s+in|while\s+/,
      java: /for\s*\(|while\s*\(/
    },
    hasConditional: {
      javascript: /if\s*\(|switch\s*\(|\?.*:/,
      python: /if\s+|elif\s+|else:/,
      java: /if\s*\(|switch\s*\(/
    },
    hasReturnValue: {
      javascript: /return\s+/,
      python: /return\s+/,
      java: /return\s+/
    }
  }
  
  for (const [patternName, langPatterns] of Object.entries(patterns)) {
    maxScore += 25
    if (langPatterns[language]?.test(code)) {
      score += 25
    }
  }
  
  return maxScore > 0 ? score / maxScore : 0
}

const analyzeRequiredConcepts = (code, language, challengeType) => {
  let score = 0
  let checksPerformed = 0
  
  const conceptPatterns = {
    variables: {
      javascript: /(?:let|const|var)\s+\w+/,
      python: /\w+\s*=/,
      java: /(?:int|String|double|boolean|float|char|long)\s+\w+/
    },
    functions: {
      javascript: /function|=>/,
      python: /def\s+/,
      java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+\w+\s*\(/
    },
    loops: {
      javascript: /for|while|\.forEach|\.map/,
      python: /for|while/,
      java: /for|while/
    },
    conditionals: {
      javascript: /if|switch|\?/,
      python: /if|elif/,
      java: /if|switch/
    },
    arrays: {
      javascript: /\[|\]|Array|\.push|\.pop/,
      python: /\[|\]|list|append/,
      java: /\[\]|ArrayList|Array/
    }
  }
  
  for (const [concept, langPatterns] of Object.entries(conceptPatterns)) {
    checksPerformed++
    if (langPatterns[language]?.test(code)) {
      score++
    }
  }
  
  return checksPerformed > 0 ? score / checksPerformed : 0
}

const analyzeInputValidation = (code, language) => {
  let score = 0
  let checks = 0
  
  const validationPatterns = {
    nullCheck: {
      javascript: /===?\s*null|!==?\s*null|!=\s*null|\?\./,
      python: /is\s+None|is\s+not\s+None|if\s+\w+:/,
      java: /==\s*null|!=\s*null|Objects\.isNull/
    },
    typeCheck: {
      javascript: /typeof|instanceof|Array\.isArray/,
      python: /isinstance|type\(/,
      java: /instanceof/
    },
    boundaryCheck: {
      javascript: /\.length|>=|<=|>\s*0|<\s*\w+\.length/,
      python: /len\(|>=|<=|>\s*0/,
      java: /\.length|\.size\(\)|>=|<=/
    }
  }
  
  for (const [checkType, langPatterns] of Object.entries(validationPatterns)) {
    checks++
    if (langPatterns[language]?.test(code)) {
      score++
    }
  }
  
  return checks > 0 ? score / checks : 0
}

const analyzeEdgeCases = (code, language) => {
  let score = 0
  let checks = 0
  
  const edgeCasePatterns = {
    emptyCheck: {
      javascript: /\.length\s*===?\s*0|!\w+\.length/,
      python: /len\(\w+\)\s*==\s*0|not\s+\w+/,
      java: /\.isEmpty\(\)|\.length\s*==\s*0|\.size\(\)\s*==\s*0/
    },
    zeroCheck: {
      javascript: /===?\s*0|!==?\s*0/,
      python: /==\s*0|!=\s*0/,
      java: /==\s*0|!=\s*0/
    },
    negativeCheck: {
      javascript: /<\s*0/,
      python: /<\s*0/,
      java: /<\s*0/
    }
  }
  
  for (const [checkType, langPatterns] of Object.entries(edgeCasePatterns)) {
    checks++
    if (langPatterns[language]?.test(code)) {
      score++
    }
  }
  
  return checks > 0 ? score / checks : 0
}

export const calculateScore = async (userCode, language, expectedOutput = null) => {
  try {
    let testsPassed = 0
    let totalTests = 1
    let executionResult = null
    
    try {
      executionResult = await executeCode(userCode, language)
      
      if (expectedOutput) {
        const actualOutput = (executionResult.stdout || '').trim()
        const expected = expectedOutput.trim()
        if (actualOutput === expected) {
          testsPassed = 1
        }
      } else if (!executionResult.stderr && !executionResult.compileOutput) {
        testsPassed = 1
      }
    } catch (error) {
      console.error('Code execution failed:', error)
    }
    
    const testCaseScore = (testsPassed / totalTests) * 50
    
    const inputValidationScore = analyzeInputValidation(userCode, language) * 10
    const edgeCaseScore = analyzeEdgeCases(userCode, language) * 10
    const readabilityScore = analyzeCodeReadability(userCode, language) * 10
    const logicScore = analyzeLogicStructure(userCode, language) * 10
    const conceptsScore = analyzeRequiredConcepts(userCode, language) * 10
    
    const totalScore = Math.round(
      testCaseScore + 
      inputValidationScore + 
      edgeCaseScore + 
      readabilityScore + 
      logicScore + 
      conceptsScore
    )
    
    return {
      passed: testsPassed,
      total: totalTests,
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        testCases: Math.round(testCaseScore),
        inputValidation: Math.round(inputValidationScore),
        edgeCases: Math.round(edgeCaseScore),
        readability: Math.round(readabilityScore),
        logicStructure: Math.round(logicScore),
        requiredConcepts: Math.round(conceptsScore)
      }
    }
  } catch (error) {
    console.error('Scoring error:', error)
    return {
      passed: 0,
      total: 1,
      score: 0,
      error: error.message
    }
  }
}

export default { calculateScore }
