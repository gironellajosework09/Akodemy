import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import Challenge from '../../models/Challenge.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CACHE_DIR = path.join(__dirname, '..', '..', 'canonical-cache')

export class CanonicalTestConverter {
  constructor(options = {}) {
    this.strict = options.strict !== false
    this.skipReimplemented = options.skipReimplemented !== false
    this.normalizeWhitespace = options.normalizeWhitespace !== false
    this.logs = []
  }

  log(level, message, data = null) {
    const entry = { level, message, timestamp: new Date().toISOString(), data }
    this.logs.push(entry)
    if (level === 'error') {
      console.error(`[Converter] ${message}`, data || '')
    } else if (level === 'warn') {
      console.warn(`[Converter] ${message}`, data || '')
    }
  }

  async convertExercise(exerciseSlug) {
    this.log('info', `Converting exercise: ${exerciseSlug}`)
    
    const canonicalData = await this.loadCanonicalData(exerciseSlug)
    if (!canonicalData) {
      this.log('error', `No canonical data found for ${exerciseSlug}`)
      return null
    }

    const cases = this.extractCases(canonicalData)
    const converted = this.normalizeCases(cases, canonicalData.exercise)

    this.log('info', `Converted ${converted.length} test cases for ${exerciseSlug}`)
    
    return {
      exercise: canonicalData.exercise,
      property: this.extractMainProperty(canonicalData),
      cases: converted,
      metadata: {
        sourceVersion: canonicalData.version || 'unknown',
        convertedAt: new Date().toISOString(),
        totalCases: converted.length,
        skippedCases: cases.length - converted.length
      }
    }
  }

  async loadCanonicalData(exerciseSlug) {
    const cachePath = path.join(CACHE_DIR, exerciseSlug, 'canonical-data.json')
    try {
      const content = await fs.readFile(cachePath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  extractMainProperty(canonicalData) {
    const cases = this.extractCases(canonicalData)
    if (cases.length > 0 && cases[0].property) {
      return cases[0].property
    }
    return canonicalData.exercise
  }

  extractCases(canonicalData, results = [], reimplementedUuids = new Set()) {
    const processGroup = (group) => {
      if (!group) return

      if (group.cases) {
        for (const item of group.cases) {
          if (item.cases) {
            processGroup(item)
          } else if (item.uuid) {
            if (item.reimplements) {
              reimplementedUuids.add(item.reimplements)
            }
            results.push({
              uuid: item.uuid,
              description: item.description,
              property: item.property,
              input: item.input,
              expected: item.expected,
              reimplements: item.reimplements,
              comments: item.comments
            })
          }
        }
      }
    }

    processGroup(canonicalData)

    if (this.skipReimplemented) {
      return results.filter(c => !reimplementedUuids.has(c.uuid))
    }

    return results
  }

  normalizeCases(cases, exerciseName) {
    return cases.map(c => this.normalizeCase(c, exerciseName))
  }

  normalizeCase(testCase, exerciseName) {
    const normalized = {
      uuid: testCase.uuid,
      description: this.normalizeDescription(testCase.description),
      property: testCase.property || exerciseName,
      input: this.normalizeInput(testCase.input),
      expected: this.normalizeExpected(testCase.expected)
    }

    return normalized
  }

  normalizeDescription(description) {
    if (!description) return ''
    let normalized = description.trim()
    if (this.normalizeWhitespace) {
      normalized = normalized.replace(/\s+/g, ' ')
    }
    return normalized
  }

  normalizeInput(input) {
    if (input === null || input === undefined) {
      return {}
    }
    return this.normalizeValue(input)
  }

  normalizeExpected(expected) {
    return this.normalizeValue(expected)
  }

  normalizeValue(value) {
    if (value === null) return null
    if (value === undefined) return null
    
    if (typeof value === 'string') {
      if (this.normalizeWhitespace) {
        return value
      }
      return value
    }
    
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        this.log('warn', `Non-finite number detected: ${value}`)
        return null
      }
      return value
    }
    
    if (typeof value === 'boolean') {
      return value
    }
    
    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v))
    }
    
    if (typeof value === 'object') {
      if (value.error !== undefined) {
        return { error: String(value.error) }
      }
      
      const normalized = {}
      for (const [k, v] of Object.entries(value)) {
        normalized[k] = this.normalizeValue(v)
      }
      return normalized
    }
    
    return value
  }

  async updateChallenge(exerciseSlug, language) {
    const converted = await this.convertExercise(exerciseSlug)
    if (!converted) {
      return { success: false, error: 'Failed to convert exercise' }
    }

    try {
      const result = await Challenge.findOneAndUpdate(
        { exercismSlug: exerciseSlug, language },
        {
          $set: {
            canonicalTests: converted.cases,
            canonicalTestsUpdatedAt: new Date(),
            canonicalTestsVersion: converted.metadata.sourceVersion
          }
        },
        { new: true }
      )

      if (!result) {
        return { 
          success: false, 
          error: `Challenge not found: ${exerciseSlug} (${language})` 
        }
      }

      this.log('info', `Updated challenge ${exerciseSlug} (${language}) with ${converted.cases.length} tests`)

      return {
        success: true,
        exercise: exerciseSlug,
        language,
        testsUpdated: converted.cases.length,
        metadata: converted.metadata
      }

    } catch (error) {
      this.log('error', `Failed to update challenge: ${error.message}`)
      return { success: false, error: error.message }
    }
  }

  async syncAllChallenges(language) {
    const challenges = await Challenge.find({ language }).lean()
    const results = {
      total: challenges.length,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: []
    }

    for (const challenge of challenges) {
      if (!challenge.exercismSlug) {
        results.skipped++
        continue
      }

      const result = await this.updateChallenge(challenge.exercismSlug, language)
      results.details.push(result)

      if (result.success) {
        results.updated++
      } else {
        results.failed++
      }
    }

    return results
  }
}

export async function convertAndSync(exerciseSlug, language) {
  const converter = new CanonicalTestConverter()
  return await converter.updateChallenge(exerciseSlug, language)
}

export async function syncAllForLanguage(language) {
  const converter = new CanonicalTestConverter()
  return await converter.syncAllChallenges(language)
}
