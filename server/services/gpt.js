// OpenAI helper for rephrasing error messages.
import OpenAI from 'openai'

// Service logic for Gpt.
let openai = null

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

export async function rephraseError(errorMessage, language, code) {
  if (!openai || !process.env.OPENAI_API_KEY) {
    return generateBasicHint(errorMessage, language)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful coding tutor. Your job is to take programming error messages and explain them in simple, beginner-friendly terms. Provide a brief hint on how to fix the error without giving away the complete solution. Keep responses concise (2-3 sentences max).`
        },
        {
          role: 'user',
          content: `The student is writing ${language} code and got this error:\n\n${errorMessage}\n\nPlease explain what this error means in simple terms and give a helpful hint on how to fix it.`
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    })

    return response.choices[0]?.message?.content || generateBasicHint(errorMessage, language)
  } catch (error) {
    console.error('OpenAI API error:', error.message)
    return generateBasicHint(errorMessage, language)
  }
}

function generateBasicHint(errorMessage, language) {
  const errorLower = errorMessage.toLowerCase()

  if (errorLower.includes('syntaxerror') || errorLower.includes('syntax error')) {
    return 'There seems to be a syntax error in your code. Check for missing brackets, parentheses, or semicolons.'
  }

  if (errorLower.includes('nameerror') || errorLower.includes('is not defined')) {
    const match = errorMessage.match(/name '(\w+)' is not defined|(\w+) is not defined/)
    const varName = match?.[1] || match?.[2] || 'variable'
    return `You're trying to use '${varName}' but it hasn't been defined yet. Check the spelling or make sure you've declared it before using it.`
  }

  if (errorLower.includes('typeerror')) {
    return 'There\'s a type mismatch in your code. You might be trying to use a value in a way that doesn\'t match its type.'
  }

  if (errorLower.includes('indexerror') || errorLower.includes('index out of')) {
    return 'You\'re trying to access an element that doesn\'t exist in your list or array. Check your index values.'
  }

  if (errorLower.includes('indentation')) {
    return 'Your code has indentation issues. Make sure your code blocks are properly aligned.'
  }

  if (errorLower.includes('null') || errorLower.includes('undefined')) {
    return 'You\'re trying to use a value that is null or undefined. Make sure the variable has a proper value before using it.'
  }

  if (errorLower.includes('cannot read property') || errorLower.includes('cannot read properties')) {
    return 'You\'re trying to access a property of something that is null or undefined. Check that your object exists before accessing its properties.'
  }

  return 'There\'s an error in your code. Review your logic and syntax carefully.'
}



