import express from 'express'
import { authenticateToken } from '../middleware/auth.js'
import { executeCode } from '../services/judge0.js'
import { rephraseError } from '../services/gpt.js'
import Submission from '../models/Submission.js'
import Challenge from '../models/Challenge.js'

const router = express.Router()

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, language, challengeId } = req.body

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' })
    }

    const result = await executeCode(code, language)

    let output = result.stdout || ''
    let error = result.stderr || result.compileOutput || ''
    let hint = null

    if (error) {
      hint = await rephraseError(error, language, code)
    }

    if (challengeId) {
      try {
        const existingSubmission = await Submission.findOne({
          userId: req.user._id,
          challengeId
        })

        if (existingSubmission) {
          existingSubmission.code = code
          existingSubmission.output = output
          existingSubmission.error = error
          existingSubmission.hint = hint
          existingSubmission.status = error ? 'error' : 'accepted'
          existingSubmission.runCount = (existingSubmission.runCount || 0) + 1
          existingSubmission.runtime = result.time
          existingSubmission.memory = result.memory
          await existingSubmission.save()
        } else {
          await Submission.create({
            userId: req.user._id,
            challengeId,
            code,
            output,
            error,
            hint,
            status: error ? 'error' : 'accepted',
            runtime: result.time,
            memory: result.memory
          })
        }
      } catch (err) {
        console.error('Failed to save submission:', err)
      }
    }

    res.json({
      output: output || error,
      error: error || null,
      hint,
      status: result.status,
      time: result.time,
      memory: result.memory
    })
  } catch (error) {
    console.error('Execute error:', error)
    res.status(500).json({ message: 'Execution failed', error: error.message })
  }
})

export default router
